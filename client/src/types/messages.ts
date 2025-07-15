import { RestartActions } from "./actions";
import { PlayerInfo } from "./player";

export type GameMove = {
  GameUpdate: {
    mv: string;
    player_id?: string;
  };
};

export type TextMessage = {
  TextMessage: {
    content: String;
    player_id: String;
  };
};

export type GameRestart = {
  GameRestart: {
    action: RestartActions;
  };
};

export type Message = {
  content: string;
  player: PlayerInfo;
};
