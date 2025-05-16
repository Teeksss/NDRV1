import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityModule } from '../security/core/security.module';
import { NetworkModule } from '../network/network.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ProjectConfiguration } from '../config/project-config';

@Module({
    imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI),
        SecurityModule,
        NetworkModule,
        AnalyticsModule
    ],
    providers: [
        {
            provide: 'PROJECT_CONFIG',
            useValue: {
                ...ProjectConfiguration,
                integrationTimestamp: '2025-05-16 06:29:54',
                integrationUser: 'Teeksss'
            }
        }
    ]
})
export class ProjectIntegrationModule implements OnModuleInit {
    async onModuleInit() {
        console.log('Proje Entegrasyonu Başlatılıyor...');
        console.log(`Zaman: 2025-05-16 06:29:54`);
        console.log(`Kullanıcı: Teeksss`);
        console.log(`Versiyon: ${ProjectConfiguration.system.version}`);
        
        await this.initializeIntegration();
    }

    private async initializeIntegration() {
        // Entegrasyon başlatma işlemleri
    }
}