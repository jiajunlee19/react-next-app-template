/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    serverExternalPackages: ['mssql', 'tedious', 'ldapjs', 'snowflake-sdk'],
    experimental: {
        useCache: true,
    },
}

module.exports = nextConfig
