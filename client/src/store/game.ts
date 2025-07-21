import { create } from "zustand";

import RoomStore from "./room";
import PlayerStore from "./player";

import { marker } from "@/types/player";

type move = {
  nextMove: number | null;
  lastMove: [number, number] | null;
};

interface store {
  move: move;
  nextPlayer?: marker;

  setNextPlayer: (marker: marker) => void;
  setMove: (move: move) => void;

  playMove: (mv: string) => void;
}

const GameStore = create<store>((set) => ({
  move: {
    nextMove: null,
    lastMove: null,
  },
  nextPlayer: undefined,

  setNextPlayer: (marker) => set({ nextPlayer: marker }),
  setMove: (move) => set({ move }),

  playMove: (mv) =>
    set((state) => {
      RoomStore.getState().ws?.send(
        JSON.stringify({
          GameUpdate: {
            mv,
            player_id: PlayerStore.getState().player.id,
          },
        }),
      );

      return state;
    }),
}));

export default GameStore;
