import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';

@Module({
  controllers: [OrgController],
})
export class OrgModule {}
