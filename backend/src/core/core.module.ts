import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { DataService } from '../services/data.service';

@Global()
@Module({
  providers: [JwtAuthGuard, RolesGuard, DataService],
  exports: [JwtAuthGuard, RolesGuard, DataService],
})
export class CoreModule {}
