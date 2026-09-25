import 'dotenv/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  // The web app proxies /api to here, so the client's IP (for rate limits)
  // comes from X-Forwarded-For set by that local proxy.
  app.set('trust proxy', 'loopback');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // One message per field; for a missing field, "… is required" rather
      // than whichever other rule happened to run first.
      exceptionFactory: (errors) =>
        new BadRequestException(
          errors.map(
            ({ property, constraints = {} }) =>
              constraints.isNotEmpty ??
              constraints.isDefined ??
              Object.values(constraints)[0] ??
              `${property} is invalid`,
          ),
        ),
    }),
  );
  // CVs can carry embedded images, which outgrow the default 100kb limit.
  app.useBodyParser('json', { limit: '10mb' });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
