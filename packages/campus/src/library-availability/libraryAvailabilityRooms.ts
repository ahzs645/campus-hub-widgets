export interface RoomInfo {
  id: number;
  name: string;
  capacity?: number;
}

export const ROOM_MAP: RoomInfo[] = [
  { id: 11258, name: 'Room 01', capacity: 4 },
  { id: 11261, name: 'Room 02', capacity: 4 },
  { id: 11262, name: 'Room 03', capacity: 4 },
  { id: 11263, name: 'Room 04', capacity: 4 },
  { id: 11264, name: 'Room 05', capacity: 4 },
  { id: 11265, name: 'Room 06', capacity: 4 },
  { id: 11266, name: 'Room 07', capacity: 6 },
  { id: 11267, name: 'Room 08', capacity: 4 },
  { id: 11268, name: 'Room 10', capacity: 2 },
  { id: 11271, name: 'Room 11', capacity: 2 },
  { id: 11272, name: 'Room 12', capacity: 2 },
  { id: 11269, name: 'Room 13', capacity: 2 },
  { id: 11270, name: 'Room 14', capacity: 2 },
  { id: 20467, name: 'Room 15', capacity: 2 },
];

const ROOM_ORDER = new Map<number, number>(ROOM_MAP.map((room, index) => [room.id, index]));
const ROOM_BY_ID = new Map<number, RoomInfo>(ROOM_MAP.map((room) => [room.id, room]));

export const roomSortValue = (room: RoomInfo): number => {
  const known = ROOM_ORDER.get(room.id);
  if (typeof known === 'number') return known;
  return 1000 + room.id;
};

export const resolveRoomInfo = (roomId: number): RoomInfo => {
  const known = ROOM_BY_ID.get(roomId);
  return known ? { ...known } : { id: roomId, name: `Room ${roomId}` };
};

export const sortRooms = (rooms: RoomInfo[]): RoomInfo[] =>
  [...rooms].sort((a, b) => roomSortValue(a) - roomSortValue(b));
