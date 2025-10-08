import { create } from "zustand";

import RoomStore from "./room";

import { marker } from "@/types/player";
import { GameAction } from "@/types/actions";

type move = {
  nextMove: number | null;
  lastMove: [number, number] | null;
};

interface store {
  move: move;
  nextPlayer?: marker;

  setNextPlayer: (marker: marker) => void;
  setMove: (move: move) => void;

  playMove: (mv: [number, number]) => void;
  rematch: (action: GameAction) => void;
  resign: () => void;
  draw: (action: GameAction) => void;
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
    RoomStore.getState().ws?.send(
      JSON.stringify({
        GameUpdate: {
          mv,
        },
      }),
    ),
  rematch: (action) => {
    RoomStore.getState().ws?.send(
      JSON.stringify({
        GameRestart: {
          action,
        },
      }),
    );
  },

  resign: () => {
    RoomStore.getState().ws?.send(JSON.stringify("Resign"));
  },
  draw: (action) => {
    RoomStore.getState().ws?.send(
      JSON.stringify({
        DrawRequest: {
          action,
        },
      }),
    );
  },
}));

export default GameStore;
