import { create } from "zustand";

import { PlayerInfo } from "@/types/player";

type Store = {
  player: PlayerInfo["marker"];

  setPlayer: (player: PlayerInfo["marker"]) => void;
};

const PlayerStore = create<Store>()((set) => ({
  player: null,

  setPlayer: (player) => set({ player: player }),
}));

export default PlayerStore;
