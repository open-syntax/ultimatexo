export type marker = "X" | "O" | null;

export type PlayerInfo = {
  marker: marker;
};

export type Player = {
  id?: string;
  info: PlayerInfo;
};