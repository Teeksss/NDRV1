import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityModule } from './security/security.module';
import { NetworkModule } from './network/network.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'development'}`
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI),
        SecurityModule,
        NetworkModule,
        AnalyticsModule,
        AuthModule,
        UserModule
    ],
    providers: [
        {
            provide: 'APP_CONFIG',
            useValue: {
                version: '3.2.0',
                lastUpdate: '2025-05-16 06:51:00',
                maintainer: 'Teeksss',
                buildNumber: '202505160651'
            }
        }
    ]
})
export class AppModule {}