import { create } from "zustand";

import RoomStore from "./room";

import { marker } from "@/types/player";
import { RestartActions } from "@/types/actions";

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
  rematch: (action: RestartActions) => void;
  resign: () => void;
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
}));

export default GameStore;
