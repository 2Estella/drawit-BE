import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DrawingService } from './drawing.service';

@WebSocketGateway(8080, {
  cors: { origin: '*' }
})
export class DrawingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(private readonly drawingService: DrawingService) {}

  handleConnection(client: Socket) {
    this.drawingService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    this.drawingService.handleDisconnect(client);
  }

  afterInit(server: Server) {
    // this.logger.log('웹소켓 서버 초기화')
    // this.drawingService.init(server);
  }

  @SubscribeMessage('draw')
  handleDraw(@MessageBody() data: any) {
    this.drawingService.handleDraw(data);
    // this.server.emit('data', data);
  }

  @SubscribeMessage('chat')
  handleChat(@MessageBody() data: string) {
    this.drawingService.handleChat(data);
  }
}
