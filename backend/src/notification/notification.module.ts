import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Services
import { NotificationService } from './notification.service';

// Entities
import { Notification, NotificationSchema } from './entities/notification.entity';
import { NotificationTemplate, NotificationTemplateSchema } from './entities/notification-template.entity';
import { NotificationChannel, NotificationChannelSchema } from './entities/notification-channel.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: NotificationChannel.name, schema: NotificationChannelSchema }
    ])
  ],
  providers: [
    NotificationService
  ],
  exports: [
    NotificationService
  ]
})
export class NotificationModule {}