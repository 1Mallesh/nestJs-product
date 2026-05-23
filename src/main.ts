import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
    rawBody: true,
  });

  // Security
  app.use((helmet as any).default());

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Serve uploaded local images as static files at /uploads/...
  app.useStaticAssets(path.join(process.cwd(), 'public'), { prefix: '/' });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Multi-Vendor E-Commerce API')
    .setDescription(
      'Production-level multi-vendor e-commerce backend API. Roles: ADMIN, CUSTOMER, VENDOR, DELIVERY_BOY',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Login, Register, Token management')
    .addTag('Users', 'User profile and addresses')
    .addTag('Vendor', 'Vendor onboarding and management')
    .addTag('Admin', 'Admin panel APIs')
    .addTag('Products', 'Product catalog')
    .addTag('Categories', 'Product categories')
    .addTag('Cart', 'Shopping cart')
    .addTag('Wishlist', 'Product wishlist')
    .addTag('Orders', 'Order management')
    .addTag('Payments', 'Razorpay payment integration')
    .addTag('Delivery', 'Delivery boy management and GPS tracking')
    .addTag('Reviews', 'Product reviews')
    .addTag('Notifications', 'User notifications')
    .addTag('Upload', 'File upload to AWS S3')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Server running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Docs:   http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket:      ws://localhost:${port}/tracking\n`);
}

bootstrap();
