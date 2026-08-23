import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CorsMiddleware } from './middleware/cors.middleware';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use('/api', new CorsMiddleware().use.bind(new CorsMiddleware()));

  // 静态文件服务：语音/图片/文件
  const uploadsDir = path.join(__dirname, '..', 'data', 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  await app.listen(process.env.PORT ?? 14725);
  console.log(`淮工集团 API 运行在: http://localhost:${process.env.PORT ?? 14725}`);
}
bootstrap();
