import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DataService } from '../../services/data.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sgbuild-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, DataService],
  exports: [AuthService],
})
export class AuthModule {}
