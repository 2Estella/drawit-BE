import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DrawingService {
  private roomList: Record<string, { roomId: string; roomName: string; masterId: string; members: number }> = {
    'room:lobby': {
      roomId: 'room:lobby',
      roomName: '로비',
      masterId: null,
      members: 0
    }
  };

  createRoom(client: Socket, data: { [key: string]: string }): void {
    const { nickname, roomName } = data;
    console.log('data!!!!', data);
    const roomId = `room:${uuidv4()}`;
    client.emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${nickname}"님이 "${roomName}"방을 생성하였습니다.`
    });

    this.roomList[roomId] = {
      roomId,
      roomName: roomName,
      masterId: client.id,
      members: 1
    };

    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);
  }

  enterRoom(client: Socket, roomId: string) {
    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);

    // console.log(this.roomList[roomId])

    this.roomList[roomId].members = this.roomList[roomId].members + 1 ?? 0;
    console.log('roomList', this.roomList[roomId]);

    const { nickname } = client.data;
    const { roomName } = this.getRoom(roomId);
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${nickname}"님이 "${roomName}"방에 입장하셨습니다.`
    });
  }

  exitRoom(client: Socket) {
    const { roomId } = client.data;
    if (this.roomList[roomId]) {
      this.roomList[roomId].members = this.roomList[roomId].members - 1;

      const { nickname } = client.data;
      client.to(roomId).emit('getMessage', {
        id: null,
        nickname: '안내',
        message: `"${nickname ?? '알수없음'}"님이 방에서 나갔습니다.`
      });

      if (this.roomList[roomId].members === 0) {
        this.deleteRoom(roomId);
      }

      client.data.roomId = 'room:lobby';
      client.rooms.clear();
      client.join('room:lobby');
    } else {
      console.error(`exitRoom: ${roomId}가 존재하지 않습니다.`);
    }
    // console.log('is working? ');
    // this.roomList[roomId].members = this.roomList[roomId].members - 1;

    // const { nickname } = client.data;
    // client.to(roomId).emit('getMessage', {
    //   id: null,
    //   nickname: '안내',
    //   message: `"${nickname ?? '알수없음'}"님이 방에서 나갔습니다.`
    // });

    // client.data.roomId = `room:lobby`;
    // client.rooms.clear();
    // client.join(`room:lobby`);
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
