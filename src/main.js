require('reflect-metadata');

const express = require('express');
const path = require('node:path');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
