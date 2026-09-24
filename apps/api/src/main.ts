import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: process.env.WEB_URL ?? 'http://localhost:3000' });
  // CVs can carry embedded images, which outgrow the default 100kb limit.
  app.useBodyParser('json', { limit: '10mb' });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
