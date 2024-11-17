import "server-only";

import type {  NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { parsedEnv } from '@/app/_libs/zod_env';
import { signIn } from '@/app/_actions/auth';
import ldap_client from "@/app/_libs/ldap";

export const options: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "LDAP",
            name: "LDAP",
            credentials: {
                username: {
                    label: "Username:",
                    type: "username",
                    placeholder: "Enter your username",
                },
                password: {
                    label: "Password:",
                    type: "password",
                    placeholder: "Enter your password",
                },
            },
            async authorize(credentials) {

                console.log('ldap checking')
                if (!credentials || !credentials.username || !credentials.password) {
                    return null;
                }
                
                // Docs: https://next-auth.js.org/tutorials/ldap-auth-example
                return new Promise((resolve, reject) => {
                    ldap_client?.bind(credentials.username, credentials.password, (error) => {
                        if (error) {
                            console.log('Failed', credentials.username)
                            reject({
                                error: "Invalid credential provided, failed to sign in!",
                                message: "Invalid credential provided, failed to sign in!"
                            })
                        }
                        else {
                            console.log('Success', credentials.username)
                            resolve({
                                username: credentials?.username,
                            } as User)
                        }
                    })
                });
            },
        }),
        CredentialsProvider({
            id: "username",
            name: "Username and Password",
            credentials: {
                username: {
                    label: "Username:",
                    type: "username",
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
                    return null;
                }

                const result = await signIn(credentials.username, credentials.password);

                if (!result || "error" in result) {
                    throw new Error(JSON.stringify(result.error))
                    // return null
                }

                return result as User;
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
        async jwt({ token, user }) {
            return {...token, ...user}
        },
        // If you want to use the role in client components
        async session({ session, token }) {
            return {...session, user: token}
        },
    },
};