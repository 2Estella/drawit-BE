import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class DrawingService {
  private clients: Socket[] = [];

  handleConnection(client: Socket) {
    this.clients.push(client);
  }

  handleDisconnect(client: Socket) {
    this.clients = this.clients.filter((c) => c !== client);
  }

  handleDraw(data: any) {
    this.clients.forEach((client) => {
      client.emit('draw', data);
    });
  }
}
