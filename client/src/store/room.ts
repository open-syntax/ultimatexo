import { create } from "zustand";

type Store = {
  roomId: number | null;
  password: string | null;

  setRoomId: (roomId: number) => void;
  setPassword: (password: string) => void;
};

const RoomStore = create<Store>()((set) => ({
  roomId: null,
  password: null,

  setRoomId: (roomId) => set({ roomId }),
  setPassword: (password) => set({ password }),
}));

export default RoomStore;
