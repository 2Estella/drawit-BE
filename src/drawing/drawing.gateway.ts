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

    client.emit('getRoomList', this.drawingService.getRoomList());
  }

  handleDisconnect(client: Socket) {
    const { roomId } = client.data;
    console.log('handleDisconnect', this.server.sockets.adapter.rooms.get(roomId));
    if (roomId !== 'room:lobby' && !this.server.sockets.adapter.rooms.get(roomId)) {
      this.drawingService.exitRoom(client);
      // this.drawingService.exitRoom(client, client.data.roomId);
      this.drawingService.deleteRoom(roomId);

      this.server.emit('getRoomList', this.drawingService.getRoomList());
    }
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
  createRoom(client: Socket, data: { [key: string]: string }) {
    console.log('createRoom data : ', data);
    if (client.data.roomId !== 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size === 1) {
      this.drawingService.deleteRoom(client.data.roomId);
    }

    client.data.nickname = data.nickname;
    this.drawingService.createRoom(client, data);

    return {
      roomId: client.data.roomId,
      roomName: this.drawingService.getRoom(client.data.roomId).roomName
    };
  }

  @SubscribeMessage('enterRoom')
  enterRoom(client: Socket, data) {
    if (client.rooms.has(data.roomId)) {
      return;
    }

    console.log('enterRoom data : ', data);

    if (client.data.roomId !== 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size === 1) {
      this.drawingService.deleteRoom(client.data.roomId);
    }

    if (!this.server.sockets.adapter.rooms.get(data.roomId)) {
      this.drawingService.createRoom(client, client.data);
    } else {
      this.drawingService.enterRoom(client, data.roomId);
    }

    const roomInfo = this.drawingService.getRoom(data.roomId);

    return {
      roomId: data.roomId,
      roomName: roomInfo ? roomInfo.roomName : ''
    };
  }

  @SubscribeMessage('exitRoom')
  exitRoom(client: Socket) {
    if (client.data.roomId !== 'room:lobby') {
      this.drawingService.exitRoom(client);
      this.server.emit('getRoomList', this.drawingService.getRoomList());
    }
    this.server.to(client.data.roomId).emit('updateRoomMembers', {
      roomId: client.data.roomId,
      members: this.drawingService.getRoom(client.data.roomId)?.members ?? 0
    });

    return {
      result: 'success'
    };
    // if (client.data.roomId !== 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size === 1) {
    //   this.drawingService.deleteRoom(client.data.roomId);
    // }

    // this.drawingService.exitRoom(client, client.data.roomId);
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
    console.log('message: ', message);
    console.log('rooms: ', client.rooms);
    client.rooms.forEach(roomId =>
      client.to(roomId).emit('getMessage', {
        id: client.id,
        nickname: client.data.nickname,
        message
      })
    );
  }
}
