import { Module } from '@nestjs/common';
import { DrawingController } from './drawing.controller';
import { DrawingService } from './drawing.service';
import { DrawingGateway } from './drawing.gateway';

@Module({
  controllers: [DrawingController],
  providers: [DrawingService, DrawingGateway]
})
export class DrawingModule {}
