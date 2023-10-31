import { User } from "payload/dist/auth"
import session from 'express-session'
import jwt from 'jsonwebtoken'
import { Config } from 'payload/config'
import OAuthButton from './OAuthButton'
import type { oAuthPluginOptions } from './types'
import {
  Field,
  fieldAffectsData,
  fieldHasSubFields,
} from 'payload/dist/fields/config/types'
import { AuthProvider } from './auth/AuthProvider'
import {generateMsalConfig } from './authConfig'
import getCookieExpiration from 'payload/dist/utilities/getCookieExpiration'
import { createOrUpdateUser } from './payload'

export { OAuthButton, oAuthPluginOptions }

// Detect client side because some dependencies may be nullified
const CLIENTSIDE = typeof session !== 'function'

/**
 * Example for Wordpress:
 *
 * ```
 * export function mijnNederlandsAuth() {
 *   return oAuthPlugin({
 *     mongoUrl: process.env.MONGO_URL,
 *     clientID: process.env.OAUTH_CLIENT_ID,
 *     clientSecret: process.env.OAUTH_CLIENT_SECRET,
 *     authorizationURL: process.env.OAUTH_SERVER + '/oauth/authorize',
 *     tokenURL: process.env.OAUTH_SERVER + '/oauth/token',
 *     callbackURL: process.env.ORIGIN + '/oauth/callback',
 *     scope: 'basic',
 *     async userinfo(accessToken) {
 *       const { data: user } = await axios.get(process.env.OAUTH_SERVER + '/oauth/me', {
 *         params: { access_token: accessToken },
 *       })
 *       return {
 *         sub: user.ID,
 *
 *         // Fields to fill in if user is created
 *         name: user.display_name || user.user_nicename || 'Nameless',
 *         email: user.user_email,
 *         role: user.capabilities?.administrator ? 'admin' : 'user',
 *       }
 *     },
 *   })
 * }
 * ```
 */
export const oAuthPlugin =
  (options: oAuthPluginOptions) =>
  (config: Config): Config => {

    return CLIENTSIDE
      ? oAuthPluginClient(config, options)
      : oAuthPluginServer(config, options)
  }

function oAuthPluginClient(
  incoming: Config,
  options: oAuthPluginOptions
): Config {
  const button: React.ComponentType<any> =
    options.components?.Button || OAuthButton
  return {
    ...incoming,
    admin: {
      ...incoming.admin,
      components: {
        ...incoming.admin?.components,
        beforeLogin: (incoming.admin?.components?.beforeLogin || []).concat(
          button
        ),
      },
    },
  }
}

function oAuthPluginServer(
  incoming: Config,
  options: oAuthPluginOptions
): Config {
  const msalConfig = generateMsalConfig(options);
  const authProvider = new AuthProvider(msalConfig);

  // step 1 - send user to msal
  const authorizePath = options.authorizePath ?? '/msal/authorize'
  // step 2 - msal calls redirect url
  const redirectPath = options.redirectPath ||(options.redirectUrl && new URL(options.redirectUrl).pathname) || '/msal/redirect'
  // step 3 - msal redirects to our route to assign a payload user
  // const successPath = options.successPath ||(options.successUrl && new URL(options.successUrl).pathname) || '/msal/success'
  const collectionSlug = (options.userCollection?.slug as 'users') || 'users'

  return {
    ...incoming,
    admin: {
      ...incoming.admin,
      webpack: (webpackConfig) => {
        const config = incoming.admin?.webpack?.(webpackConfig) || webpackConfig
        return {
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...config.resolve?.alias,
              'connect-mongo': false,
              'express-session': false,
              '@azure/msal-node': false,
              jsonwebtoken: false,
              passport: false,
            },
          },
        }
      },
    },
    endpoints: (incoming.endpoints || []).concat([
      {
        path: authorizePath,
        method: 'get',
        root: true,
        handler: authProvider.login({
          scopes: [],
          redirectUri: options.redirectUrl,
          successRedirect: options.successUrl,
        }),
      },
      {
        path: '/msal/test',
        method: 'get',
        root: true,
        async handler(req, res, next) {
          // Get the Mongoose user
          //const collectionConfig = payload.collections[collectionSlug].config
          res.setHeader('Content-Type', 'application/json');
          res.send({ collectionSlug, payload: req.payload.collections });
        }
      },
      {
        path: redirectPath,
        method: 'post',
        root: true,
        handler: authProvider.handleRedirect()
      },
      {
        path: redirectPath,
        method: 'post',
        root: true,
        async handler(req, res) {
          // Get the Mongoose user
          const collectionConfig = req.payload.collections[collectionSlug].config

          // Sanitize the user object
          // let user = userDoc.toJSON({ virtuals: true })
          const currentUser = await createOrUpdateUser({
            account: (req.session as any).account,
            payload: req.payload,
            options
          })
          console.log('currentUser', currentUser, 'account', (req.session as any).account)
          if (!currentUser) {
            return
          }

          const user: User = currentUser

          // Decide which user fields to include in the JWT
          const fieldsToSign = collectionConfig.fields.reduce(
            (signedFields, field: Field) => {
              const result = {
                ...signedFields,
              }

              if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
                field.fields.forEach((subField) => {
                  if (fieldAffectsData(subField) && subField.saveToJWT) {
                    result[subField.name] = user[subField.name]
                  }
                })
              }

              if (fieldAffectsData(field) && field.saveToJWT) {
                result[field.name] = user[field.name]
              }

              return result
            },
            {
              email: user.email,
              id: user.id,
              collection: collectionConfig.slug,
            } as any
          )

          // Sign the JWT
          const token = jwt.sign(fieldsToSign, req.payload.secret, {
            expiresIn: collectionConfig.auth.tokenExpiration,
          })

          // Set cookie
          res.cookie(`${req.payload.config.cookiePrefix}-token`, token, {
            path: '/',
            httpOnly: true,
            expires: getCookieExpiration(collectionConfig.auth.tokenExpiration),
            secure: collectionConfig.auth.cookies.secure,
            sameSite: collectionConfig.auth.cookies.sameSite,
            domain: collectionConfig.auth.cookies.domain || undefined,
          })

          // Redirect to admin dashboard
          res.redirect('/admin')
        },
      }
    ]),
  }
}
