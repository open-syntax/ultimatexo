import { SVGProps } from "react";

import { marker, Player } from "./player";
import { playerActions, GameAction } from "./actions";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export enum BoardStatus {
  WaitingForPlayers = "WaitingForPlayers",
  InProgress = "InProgress",
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
        board: { boards: Board; status: BoardStatus };
        next_player: { marker: marker };
        next_board: number | null;
        last_move: [number, number] | null;
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
      event: "GameRestart";
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
        player: marker;
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
