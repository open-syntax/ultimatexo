import { RestartActions } from "./actions";

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
