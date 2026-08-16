import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CorsMiddleware } from './middleware/cors.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use('/api', new CorsMiddleware().use.bind(new CorsMiddleware()));
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`SG-Build API 运行在: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
