import { create } from "zustand";

import { marker, Player } from "@/types/player";

type Store = {
  player: Player;
  ws?: WebSocket;
  nextPlayer?: marker;

  setPlayer: (player: Player) => void;
  setNextPlayer: (player: marker) => void;
  setAvailableBoards: (boards: number | null) => void;
  setWs: (ws: WebSocket) => void;

  availableBoards: number | null;

  playMove: (mv: string) => void;
};

const PlayerStore = create<Store>()((set) => ({
  player: {
    info: {
      marker: "X",
    },
  },

  ws: undefined,
  nextPlayer: undefined,
  availableBoards: null,

  playMove: (mv) =>
    set((state) => {
      state.ws?.send(
        JSON.stringify({
          GameUpdate: {
            mv,
            player_id: state.player.id,
          },
        }),
      );

      return state;
    }),

  setPlayer: (player) => set({ player: player }),
  setNextPlayer: (marker) => set({ nextPlayer: marker }),
  setAvailableBoards: (boards) => set({ availableBoards: boards }),
  setWs: (ws) => set({ ws }),
}));

export default PlayerStore;
