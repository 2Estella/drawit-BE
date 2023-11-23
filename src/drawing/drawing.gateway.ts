import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  // OnGatewayInit,
  SubscribeMessage
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
    client.leave(client.id);
    client.data.roomId = 'room:lobby';
    client.join('room:lobby');
  }

  handleDisconnect(client: Socket) {
    const { roomId } = client.data;
    if (!this.server.sockets.adapter.rooms.get(roomId)) {
      this.drawingService.deleteRoom(roomId);
      this.server.emit('getChatRoomList', this.drawingService.getRoomList());
    }
    console.log('disconnected : ', client.id);
  }

  @SubscribeMessage('setInit')
  setInit(client: Socket, data) {
    if (!client.data.isInit) {
      client.data.nickname = data.nickname ? data.nickname : `user-${client.id}`;
      client.data.isInit = true;
    }

    return {
      id: client.id,
      nickname: client.data.nickname,
      room: {
        roomId: 'room:lobby',
        roomName: '로비'
      }
    };
  }

  @SubscribeMessage('getRoomList')
  getRoomList(client: Socket) {
    client.emit('getRoomList', this.drawingService.getRoomList());
  }

  @SubscribeMessage('createRoom')
  createRoom(client: Socket, nickname: string, roomName: string) {
    console.log(roomName);
    if (client.data.roomId !== 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size === 1) {
      this.drawingService.deleteRoom(client.data.roomId);
    }

    client.data.nickname = nickname;
    this.drawingService.createRoom(client, nickname, roomName);

    return {
      roomId: client.data.roomId,
      roomName: this.drawingService.getRoom(client.data.roomId).roomName
    };
  }

  @SubscribeMessage('enterRoom')
  enterRoom(client: Socket, roomId: string) {
    if (client.rooms.has(roomId)) {
      return;
    }

    if (client.data.roomId !== 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size === 1) {
      this.drawingService.deleteRoom(client.data.roomId);
    }

    this.drawingService.deleteRoom(client.data.roomId);

    return {
      roomId: roomId,
      roomName: this.drawingService.getRoom(roomId).roomName
    };
  }

  @SubscribeMessage('setNickname')
  setNickname(client: Socket, nickname: string) {
    client.data.nickname = nickname;
  }

  @SubscribeMessage('sendDrawLines')
  sendDrawLines(client: Socket, data: any) {
    client.rooms.forEach(roomId => client.to(roomId).emit('getDrawLines', data));
  }

  @SubscribeMessage('sendMessage')
  sendMessage(client: Socket, message: string) {
    client.rooms.forEach(roomId =>
      client.to(roomId).emit('getMessage', {
        id: client.id,
        nickname: client.data.nickname,
        message
      })
    );
  }
}
