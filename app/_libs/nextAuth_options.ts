import "server-only";

import type { NextAuthOptions, User } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { parsedEnv } from '@/app/_libs/zod_env';
import { signIn, signInAzureAD, signInLDAP } from '@/app/_actions/auth';

export const options: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: parsedEnv.AZURE_CLIENT_ID,
            clientSecret: parsedEnv.AZURE_CLIENT_SECRET,
            tenantId: parsedEnv.AZURE_TENANT_ID,
            checks: ["pkce"],
            authorization: {
                params: {
                    scope: "openid profile email User.Read",
                },
            },
        }),
        CredentialsProvider({
            id: "LDAP",
            name: "LDAP",
            credentials: {
                username: {
                    label: "Username:",
                    type: "text",
                    placeholder: "Enter your username",
                },
                password: {
                    label: "Password:",
                    type: "password",
                    placeholder: "Enter your password",
                },
            },
            async authorize(credentials) {

                if (!credentials || !credentials.username || !credentials.password) {
                    return null;
                }
                
                // Docs: https://github.com/ldapts/ldapts/tree/main
                const result = await signInLDAP(credentials.username, credentials.password);

                if (!result.success && result.message) {
                    throw new Error(result.message)
                    // return null
                }

                return result.data as User;
            },
        }),
        CredentialsProvider({
            id: "username",
            name: "Username and Password",
            credentials: {
                username: {
                    label: "Username:",
                    type: "text",
                    placeholder: "Enter your username",
                },
                password: {
                    label: "Password:",
                    type: "password",
                    placeholder: "Enter your password",
                },
            },
            async authorize(credentials) {
                // This is where you need to retrieve user data 
                // to verify with credentials
                // Docs: https://next-auth.js.org/configuration/providers/credentials
                if (!credentials || !credentials.username || !credentials.password) {
                    throw new Error(JSON.stringify({
                        error: ["Invalid user provided, failed to sign in!"],
                        message: "Invalid user provided, failed to sign in!"
                    }))
                }

                const result = await signIn(credentials.username, credentials.password);

                if (!result.success && result.message) {
                    throw new Error(result.message)
                    // return null
                }

                return result.data as User;
            }
        }),
    ],

    pages: {
        // Define custom page if required
        signIn: '/auth/signIn',
        signOut: '/auth/signOut',
    },

    secret: parsedEnv.NEXTAUTH_SECRET,

    session: {
        strategy: 'jwt',
        maxAge: 2 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },

    callbacks: {
        // Ref: https://authjs.dev/guides/basics/role-based-access-control#persisting-the-role
        async jwt({ token, user, account }) {

            if (account?.provider === "azure-ad") {
                const username = user.email?.split("@")[0].toLowerCase();
                const result = await signInAzureAD(username);

                if (!result.success && result.message) {
                    throw new Error(result.message)
                }

                if (user?.image) {
                    token.picture = user.image;
                }

                return {...token, ...result}
            }

            return {...token, ...user}
        },
        // If you want to use the role in client components
        async session({ session, token }) {
            return {...session, user: token}
        },
    },
};