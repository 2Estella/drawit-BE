export class RoomListDto {
  roomId: string;
  roomName: string;
  masterId: string;
  members: number;
}

export class SetInitDto {
  nickname: string;
  id: string;
}

export class RoomItemDto {
  roomId: string;
  roomName: string;
}

export class RoomDto extends SetInitDto {
  room: RoomItemDto;
}

export class CreateRoomDto {
  roomId?: string;
  roomName: string;
  nickname: string;
}

export class ResultDto {
  result: string;
}
