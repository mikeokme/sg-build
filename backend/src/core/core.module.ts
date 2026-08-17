import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SseJwtGuard } from '../guards/sse-jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { DataService } from '../services/data.service';

@Global()
@Module({
  providers: [JwtAuthGuard, SseJwtGuard, RolesGuard, DataService],
  exports: [JwtAuthGuard, SseJwtGuard, RolesGuard, DataService],
})
export class CoreModule {}
