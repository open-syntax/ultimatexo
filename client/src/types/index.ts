import { SVGProps } from "react";

import { marker, Player, PlayerInfo } from "./player";
import { playerActions, RestartActions } from "./actions";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

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
        board: { boards: Board; status: string };
        next_player: PlayerInfo;
        next_board: number | null;
        last_move: string;
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
    };
