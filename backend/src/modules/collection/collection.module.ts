import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { AuditController } from './audit.controller';
import { CollectionService } from './collection.service';

@Module({
  controllers: [CollectionController, AuditController],
  providers: [CollectionService],
})
export class CollectionModule {}