import { create } from "zustand";

import { Message } from "@/types/messages";

type Store = {
  chat: Message[];
  ws?: WebSocket;
  mode: "Local" | "Online" | "Bot";

  setWs: (ws: WebSocket | undefined) => void;
  setMode: (mode: "Local" | "Online" | "Bot") => void;

  clearChat: () => void;
  pushMessage: (message: Message) => void;
  sendMessage: (message: string) => void;
};

const RoomStore = create<Store>()((set) => ({
  chat: [],
  ws: undefined,
  mode: "Online",

  setWs: (ws) => set({ ws }),
  setMode: (mode) => set({ mode }),

  clearChat: () => set({ chat: [] }),

  pushMessage: (message) =>
    set((state) => ({
      chat: [...state.chat, message],
    })),

  sendMessage: (message) => {
    const state = RoomStore.getState();

    state.ws?.send(
      JSON.stringify({
        TextMessage: {
          content: message,
        },
      }),
    );
  },
}));

export default RoomStore;
