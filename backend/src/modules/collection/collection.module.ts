import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { AuditController } from './audit.controller';
import { NotificationController } from './notification.controller';
import { CollectionService } from './collection.service';

@Module({
  controllers: [CollectionController, AuditController, NotificationController],
  providers: [CollectionService],
})
export class CollectionModule {}