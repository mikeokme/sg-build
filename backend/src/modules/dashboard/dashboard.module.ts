import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { TodoController } from './todo.controller';

@Module({
  controllers: [DashboardController, TodoController],
})
export class DashboardModule {}
