import { create } from "zustand";

import { Marker } from "@/types/player";
import { GameAction } from "@/types/actions";

interface Move {
  nextMove: number | null;
  lastMove: [number, number] | null;
}

interface Store {
  move: Move;
  nextPlayer?: Marker;

  setNextPlayer: (marker: Marker) => void;
  setMove: (move: Move) => void;

  playMove: (mv: [number, number], ws?: WebSocket) => void;
  rematch: (action: GameAction, ws?: WebSocket) => void;
  resign: (ws?: WebSocket) => void;
  draw: (action: GameAction, ws?: WebSocket) => void;
}

const GameStore = create<Store>((set) => ({
  move: {
    nextMove: null,
    lastMove: null,
  },
  nextPlayer: undefined,

  setNextPlayer: (marker) => set({ nextPlayer: marker }),
  setMove: (move) => set({ move }),

  playMove: (mv, ws) => {
    ws?.send(
      JSON.stringify({
        GameUpdate: {
          mv,
        },
      }),
    );
  },
  rematch: (action, ws) => {
    ws?.send(
      JSON.stringify({
        RematchRequest: {
          action,
        },
      }),
    );
  },

  resign: (ws) => {
    ws?.send(JSON.stringify({ Resign: true }));
  },
  draw: (action, ws) => {
    ws?.send(
      JSON.stringify({
        DrawRequest: {
          action,
        },
      }),
    );
  },
}));

export default GameStore;
