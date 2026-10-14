import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: 'http://localhost:3000' });
  app.useStaticAssets(join(process.cwd(), 'images'), { prefix: '/images' });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();