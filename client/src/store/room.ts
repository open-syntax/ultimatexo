import { create } from "zustand";

import { Message } from "@/types/messages";

type Store = {
  roomId: number | null;
  password: string | null;
  chat: Message[];
  ws?: WebSocket;
  mode: "Local" | "Online" | "Bot";

  setRoomId: (roomId: number) => void;
  setPassword: (password: string) => void;
  setWs: (ws: WebSocket | undefined) => void;
  setMode: (mode: "Local" | "Online" | "Bot") => void;

  clearChat: () => void;
  pushMessage: (message: Message) => void;
  sendMessage: (message: string) => void;
};

const RoomStore = create<Store>()((set) => ({
  roomId: null,
  password: null,
  chat: [],
  ws: undefined,
  mode: "Online",

  setRoomId: (roomId) => set({ roomId }),
  setPassword: (password) => set({ password }),
  setWs: (ws) => set({ ws }),
  setMode: (mode) => set({ mode }),

  clearChat: () => set({ chat: [] }),

  pushMessage: (message) =>
    set((state) => ({
      chat: [...state.chat, message],
    })),

  sendMessage: (message) =>
    set((state) => {
      state.ws?.send(
        JSON.stringify({
          TextMessage: {
            content: message,
          },
        }),
      );

      return state;
    }),
}));

export default RoomStore;
