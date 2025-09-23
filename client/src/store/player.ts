import { create } from "zustand";

import { Player } from "@/types/player";

type Store = {
  player: Player | null;

  setPlayer: (player: Player) => void;
};

const PlayerStore = create<Store>()((set) => ({
  player: null,

  setPlayer: (player) => set({ player: player }),
}));

export default PlayerStore;
