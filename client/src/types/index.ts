import { SVGProps } from "react";

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
  cells: BoardCell[];
  status: "InProgress" | "Draw" | "X" | "O";
};

export type BoardCell = {
  cells: "O" | "X" | null;
};

export type socketEvent =
  | {
      event: "GameUpdate";
      data: {
        board: { boards: Board };
        status: string;
        next_player: {
          id: string;
          marker: "X" | "O";
        };
        next_board: number | null;
      };
    }
  | {
      event: "PlayerUpdate";
      data: {
        action: "PLAYER_LEFT" | "PLAYER_JOINED";
        player: {
          id: string;
          marker: "X" | "O";
        };
      };
    }
  | {
      event: "Error";
      data: {
        error: string;
      };
    };
