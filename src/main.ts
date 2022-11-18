import { NestFactory } from '@nestjs/core';
import { resolveDynamicProviders } from 'nestjs-dynamic-providers';

import mongoose from 'mongoose';
import { AppModule } from './app.module';

// somewhere in your code
if (process.env.NODE_ENV === 'development') mongoose.set('debug', true);
async function bootstrap() {
  await resolveDynamicProviders();
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();
}

bootstrap();
