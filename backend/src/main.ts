// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe ());
  app.enableCors({ origin: 'http://localhost:3000' });
  app.useStaticAssets(join(process.cwd(), 'images'), { prefix: '/images' });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();