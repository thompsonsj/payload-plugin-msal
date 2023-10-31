/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */

import { oAuthPluginOptions } from "./types"

export const generateMsalConfig = (options: oAuthPluginOptions) => {
  return {
    auth: {
        clientId: options.clientId, // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
        authority: options.cloudInstance + options.tenantId, // Full directory URL, in the form of https://login.microsoftonline.com/<tenant>
        clientSecret: options.clientSecret // Client secret generated from the app registration in Azure portal
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel: number, message: string, containsPii: boolean) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: 3,
        }
    }
}}

export interface MsalConfig {
  auth: {
      clientId: string;
      authority: string;
      clientSecret: string;
      authorityMetadata?: string;
      cloudDiscoveryMetadata?: string;
  };
  system: {
      loggerOptions: {
          loggerCallback(loglevel: number, message: string, containsPii: boolean): void;
          piiLoggingEnabled: boolean;
          logLevel: number;
      };
  };
}
