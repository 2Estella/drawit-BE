import { Controller, Get, Render } from '@nestjs/common';
import { DrawingService } from './drawing.service';

@Controller('drawing')
export class DrawingController {
  constructor(private readonly drawingService: DrawingService) {}

  @Get()
  @Render('index')
  root() {
    return { title: 'drawit' };
  }
}
