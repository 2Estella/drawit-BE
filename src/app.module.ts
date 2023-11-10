import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrawingModule } from './drawing/drawing.module';
import { DrawingService } from './drawing/drawing.service';

@Module({
  imports: [DrawingModule],
  controllers: [AppController],
  providers: [AppService, DrawingService],
})
export class AppModule {}
