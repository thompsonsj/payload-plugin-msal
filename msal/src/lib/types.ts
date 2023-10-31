import { type SessionOptions } from 'express-session'
import type { ComponentType } from 'react'

export interface oAuthPluginOptions {
  /** Database connection URI in case the lib needs access to database */
  databaseUri: string

  /** Options to pass to express-session
   * @default
   * ```js
   * {
   *    resave: false,
   *    saveUninitialized: false,
   *    secret: process.env.PAYLOAD_SECRET,
   *    store: options.databaseUri
   *        ? MongoStore.create({ mongoUrl: options.databaseUri })
   *        : undefined,
   * }),
   * ```
   *
   */
  sessionOptions?: SessionOptions

  /** Map an authentication result to a user */
  userinfo: (accessToken: string) => Promise<{
    /** Unique identifier for the linked account */
    sub: string
    /** Unique identifier for the linked account */
    email?: string
    /** A password will be generated for new users */
    password?: string
    /** Example of a custom field */
    name?: string
  }>

  /** Which path to mount in express, defaults to the path in callbackURL */
  callbackPath?: string

  components?: {
    Button?: ComponentType<any>
  }
  userCollection?: {
    /** Defaults to "users" */
    slug?: string
  }
  /** If the collection does not have a field with name "sub", it will be created */
  subField?: {
    /** Defaults to "sub" */
    name?: string
  }

  /** MSAL options */
  
  cloudInstance: string
  tenantId: string
  clientId: string
  clientSecret: string
  redirectUrl: string
  successUrl: string
  graphApiEndpoint: string
  expressSessionSecret: string

  /** Endpoints to handle callbacks from MSAL */
  /**
   * @default /msal/authorize
   */
  authorizePath?: string
  /**
   * Can likely leave this alone.
   * 
   * Defaults to the path extracted from redirectUrl or `/msal/redirect`
   */
  redirectPath?: string
  /**
   * Can likely leave this alone.
   * 
   * Defaults to the path extracted from successUrl or `/msal/success`
   */
  successPath?: string
}

export interface AuthOptions {
  scopes?: string[]
  redirectUri?: string
  successRedirect?: string
  postLogoutRedirectUri?: string
}

export interface MsalAccount {
  homeAccountId: string
  environment: string
  tenantId: string
  username: string
  localAccountId: string
  name: string
  idTokenClaims: {
    aud: string,
    iss: string,
    iat: number,
    nbf: number,
    exp: number,
    name: string,
    oid: string,
    preferred_username: string,
    rh: string,
    sub: string,
    tid: string,
    uti: string,
    ver: string
  }
}
