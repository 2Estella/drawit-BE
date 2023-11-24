import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DrawingService {
  private roomList: Record<string, { roomId: string; roomName: string; masterId: string }> = {
    'room:lobby': {
      roomId: 'room:lobby',
      roomName: '로비',
      masterId: null
    }
  };

  createRoom(client: Socket, data: { [key: string]: string }): void {
    const roomId = `room:${uuidv4()}`;
    client.emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${data.nickname}"님이 "${data.roomName}"방을 생성하였습니다.`
    });

    this.roomList[roomId] = {
      roomId,
      roomName: data.roomName,
      masterId: client.id
    };

    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);
  }

  enterRoom(client: Socket, roomId: string) {
    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);

    const { nickname } = client.data;
    const { roomName } = this.getRoom(roomId);
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${nickname}"님이 "${roomName}"방에 입장하셨습니다.`
    });
  }

  exitRoom(client: Socket, roomId: string) {
    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);

    const { nickname } = client.data;
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${nickname}"님이 방에서 나갔습니다.`
    });
  }

  getRoom(roomId: string) {
    return this.roomList[roomId];
  }

  getRoomList() {
    return this.roomList;
  }

  deleteRoom(roomId: string) {
    delete this.roomList[roomId];
  }
}
