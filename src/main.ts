import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appLogger = new Logger('AppLogger');
  appLogger.debug('This is a debug log.');

  app.enableCors();

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(3001);
}
bootstrap();
