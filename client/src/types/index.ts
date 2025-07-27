import { SVGProps } from "react";

import { marker, Player, PlayerInfo } from "./player";
import { playerActions, RestartActions } from "./actions";

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
        next_player: PlayerInfo;
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
        action: RestartActions;
        player: marker;
      };
    }
  | {
      event: "TextMessage";
      data: {
        content: string;
        player: PlayerInfo;
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
