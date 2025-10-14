import { GameAction } from "./actions";
import { Player } from "./player";

export type GameMove = {
  GameUpdate: {
    mv: string;
  };
};

export type TextMessage = {
  TextMessage: {
    content: String;
  };
};

export type GameRestart = {
  GameRestart: {
    action: GameAction;
  };
};

export type Message = {
  content: string;
  player: { marker: Player["marker"] };
};
