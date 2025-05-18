import { DefaultJobQueuePlugin, DefaultSearchPlugin, dummyPaymentHandler, VendureConfig, } from '@vendure/core';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import path from 'path';
import { DefaultAssetNamingStrategy } from '@vendure/core';

export const config: VendureConfig = {
    apiOptions: {
        hostname: '0.0.0.0',
        port: 3000,
        adminApiPath: 'admin-api',
        adminApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        }, // turn this off for production
        adminApiDebug: true, // turn this off for production
        shopApiPath: 'shop-api',
        shopApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        }, // turn this off for production
        shopApiDebug: true, // turn this off for production
    },
    authOptions: {
        superadminCredentials: {
            identifier: 'superadmin',
            password: 'superadmin',
        },
        requireVerification: true,
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || '3r8wq8jdo92',
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: false, // turn this off for production
        logging: false,
        database: 'vendure',
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT) || 5432,
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        migrations: [path.join(__dirname, '../migrations/*.ts')],
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    customFields: {},
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            namingStrategy: new DefaultAssetNamingStrategy(),
            storageStrategyFactory: configureS3AssetStorage({
                bucket: process.env.CLOUDFLARE_R2_BUCKET || 'your-bucket-name',
                credentials: {
                    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'your-access-key-id',
                    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || 'your-secret-access-key',
                },
                nativeS3Configuration: {
                    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || 'https://<account-id>.r2.cloudflarestorage.com',
                    forcePathStyle: true,
                    signatureVersion: 'v4',
                    region: 'auto', // Cloudflare R2不需要特定区域，但S3 SDK要求此字段
                },
            }),
            assetUrlPrefix: process.env.ASSET_URL_PREFIX || 'https://<your-cdn-domain>.com', // 公共访问URL，可以是Cloudflare CDN
        }),
        DefaultJobQueuePlugin,
        DefaultSearchPlugin,
        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
        }),
        EmailPlugin.init({
            route: 'mailbox',
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
    ],
};

