import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";
import { webpackBundler } from "@payloadcms/bundler-webpack";

import { buildConfig } from 'payload/config';
import path from 'path';
import Categories from './collections/Categories';
import Posts from './collections/Posts';
import Tags from './collections/Tags';
import Users from './collections/Users';

import { oAuthPlugin } from 'payload-plugin-msal'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env['MONGODB_URI'] || ``,
  }),
  admin: {
    bundler: webpackBundler(),
    webpack: (config) => {
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            "payload-plugin-msal": path.resolve(__dirname, "../../msal/src/index.ts"),
          }
        }
      }
    },
    user: Users.slug,
  },
  plugins: [
    oAuthPlugin({
      databaseUri: process.env['MONGODB_URI'] || ``,
      cloudInstance: process.env['CLOUD_INSTANCE'] || ``,
      tenantId: process.env['TENANT_ID'] || ``,
      clientId: process.env['CLIENT_ID'] || ``,
      clientSecret: process.env['CLIENT_SECRET'] || ``,
      redirectUrl: process.env['REDIRECT_URI'] || ``,
      successUrl: process.env['SUCCESS_URL'] || ``,
      // postLogoutRedirectUrl: process.env['POST_LOGOUT_REDIRECT_URI'] || ``,
      graphApiEndpoint: process.env['GRAPH_API_ENDPOINT'] || ``,
      userinfo: async (accessToken) => ({ sub: accessToken}),
      expressSessionSecret: 'not required',
    })
  ],
  collections: [
    Categories,
    Posts,
    Tags,
    Users,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
