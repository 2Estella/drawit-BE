import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  // OnGatewayInit,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DrawingService } from './drawing.service';

@WebSocketGateway(8080, {
  cors: { origin: '*' }
})
export class DrawingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly drawingService: DrawingService) {}
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.drawingService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    this.drawingService.handleDisconnect(client);
  }

  @SubscribeMessage('setInit')
  setInit(client: Socket, data) {
    if (client.data.isInit) {
      return;
    }

    client.data.nickname = data.nickname ? data.nickname : `user-${client.id}`;
    client.data.isInit = true;

    return {
      id: client.id,
      nickname: client.data.nickname,
      room: {
        roomId: 'room:lobby',
        name: '로비'
      }
    };
  }

  @SubscribeMessage('draw')
  handleDraw(@MessageBody() data: any) {
    this.drawingService.handleDraw(data);
    // this.server.emit('data', data);
  }

  @SubscribeMessage('sendMessage')
  sendMessage(client: Socket, message: string): void {
    client.rooms.forEach(roomId =>
      client.to(roomId).emit('getMessage', {
        id: client.id,
        nickname: client.data.nickname,
        message
      })
    );
  }
}
