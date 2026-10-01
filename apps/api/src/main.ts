import 'dotenv/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { requestContextMiddleware } from './audit/request-context.js';
import { setupApiDocs } from './public-api/openapi.js';

async function bootstrap() {
  // The raw body is kept for checking payment webhooks' signatures.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  // The web app proxies /api to here, so the client's IP (for rate limits)
  // comes from X-Forwarded-For set by that local proxy.
  app.set('trust proxy', 'loopback');
  app.use(cookieParser());
  app.use(requestContextMiddleware);
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
  setupApiDocs(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
