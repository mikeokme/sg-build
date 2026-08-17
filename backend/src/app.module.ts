import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionModule } from './modules/collection/collection.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ChatModule } from './modules/chat/chat.module';
import { OrgModule } from './modules/org/org.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sgbuild-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    CoreModule,
    AuthModule,
    CollectionModule,
    DashboardModule,
    ChatModule,
    OrgModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [JwtModule],
})
export class AppModule {}