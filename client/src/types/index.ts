import { SVGProps } from "react";

import { playerActions, GameAction } from "./actions";

import { marker, Player } from "@/types/player";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export enum BoardStatus {
  WaitingForPlayers = "WaitingForPlayers",
  Paused = "Paused",

  // Won
  X = "X",
  O = "O",

  Draw = "Draw",
}

export type Board = [
  miniBoard,
  miniBoard,
  miniBoard,
  miniBoard,
  miniBoard,
  miniBoard,
  miniBoard,
  miniBoard,
  miniBoard,
];

export type miniBoard = {
  cells: boardCell[];
  status: "InProgress" | "Draw" | "X" | "O";
};

export type boardCell = {
  cells: marker;
};

export type socketEvent =
  | {
      event: "GameUpdate";
      data: {
        board: { boards: Board; status: BoardStatus | null };
        next_player: { marker: marker };
        next_board: number | null;
        last_move: [number, number] | null;
        score: [number, number];
      };
    }
  | {
      event: "PlayerUpdate";
      data: {
        action: playerActions;
        player: Player;
      };
    }
  | {
      event: "RematchRequest";
      data: {
        action: GameAction;
        player: marker;
      };
    }
  | {
      event: "DrawRequest";
      data: {
        action: GameAction;
        player: marker;
      };
    }
  | {
      event: "TextMessage";
      data: {
        content: string;
        player: { marker: marker };
      };
    }
  | {
      event: "Error";
      data: {
        error: string;
      };
    }
  | {
      event: "Ping";
    };
