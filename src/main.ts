import { NestFactory } from '@nestjs/core';
import { resolveDynamicProviders } from 'nestjs-dynamic-providers';

import { AppModule } from './app.module';
import mongoose from 'mongoose';

// somewhere in your code
mongoose.set('debug', true);
async function bootstrap() {
  await resolveDynamicProviders();
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.init();
}

bootstrap();
