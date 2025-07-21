import { create } from "zustand";

import { Player } from "@/types/player";

type Store = {
  player: Player;

  setPlayer: (player: Player) => void;
};

const PlayerStore = create<Store>()((set) => ({
  player: {
    info: {
      marker: "X",
    },
  },

  setPlayer: (player) => set({ player: player }),
}));

export default PlayerStore;
