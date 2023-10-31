import { User } from "payload/dist/auth"
import { PaginatedDocs } from "payload/dist/database/types"
import { MsalAccount, oAuthPluginOptions } from "./types";
import { str62 } from '@bothrs/util/random'

interface IcreateOrUpdateUser {
  account: MsalAccount,
  payload: any
  options: oAuthPluginOptions
}

export const createOrUpdateUser = async ({account, payload, options}: IcreateOrUpdateUser) => {
  const collectionSlug = (options.userCollection?.slug as 'users') || 'users'

  let user: User & { collection?: any; _strategy?: any }
  let users: PaginatedDocs<User>
  try {
    // Match existing user
    users = await payload.find({
      collection: collectionSlug,
      where: { email: { equals: account.username } },
    })

    if (users.docs && users.docs.length) {
      user = users.docs[0]
    } else {
      // Register new user
      user = await payload.create({
        collection: collectionSlug,
        data: {
          email: account.username,
          password: str62(20),
        },
        showHiddenFields: true,
      })
    }
    return user
  } catch (error: any) {
    console.log('signin.fail', error.message, error.trace)
  }
}
