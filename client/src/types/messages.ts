import { Player } from "./player";

export type Message = {
  content: string;
  player: { marker: Player["marker"] };
};
