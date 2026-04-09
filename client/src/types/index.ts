import { SVGProps } from "react";

import { GameAction } from "./actions";

import { Marker, Player } from "@/types/player";

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

export enum RoomStatus {
  loading = "loading",
  connected = "connected",
  disconnected = "disconnected",
  opponentLeft = "opponent left",
  connecting = "connecting",
  internal = "internal",
  error = "error",
  auth = "auth required",
  authFailed = "auth failed",
  notFound = "room not found",
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
  cells: Marker[];
  status: "InProgress" | "Draw" | "X" | "O";
};

export type boardCell = Marker;

export type PlayerAction =
  | "Joined"
  | "Left"
  | "Reconnected"
  | { Disconnected: number };

export type socketEvent =
  | {
      event: "GameUpdate";
      data: {
        board: { boards: Board; status: BoardStatus | null };
        next_player: { marker: Marker };
        next_board: number | null;
        last_move: [number, number] | null;
        score: [number, number];
      };
    }
  | {
      event: "PlayerUpdate";
      data: {
        action: PlayerAction;
        player: Player;
      };
    }
  | {
      event: "RematchRequest";
      data: {
        action: GameAction;
        player: Marker;
      };
    }
  | {
      event: "DrawRequest";
      data: {
        action: GameAction;
        player: Marker;
      };
    }
  | {
      event: "TextMessage";
      data: {
        content: string;
        player: { marker: Marker };
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
