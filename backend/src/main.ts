// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe ());
  // Local mặc định; production cấu hình CORS_ORIGIN bằng domain HTTPS thực tế.
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });
  app.useStaticAssets(join(process.cwd(), 'images'), { prefix: '/images' });
  const config = new DocumentBuilder()
    .setTitle('BrewLite API Assigment 1')
    .setDescription('Tài liệu API backend cho hệ thống BrewLite')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api_assignment1', app, document);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();