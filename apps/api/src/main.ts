import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app-setup.js';

async function bootstrap() {
  // The raw body is kept for checking payment webhooks' signatures.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  configureApp(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
