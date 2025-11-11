import { create } from "zustand";

import { Player } from "@/types/player";

type Store = {
  player: Player | null;
  theme: "dark" | "light";
  setPlayer: (player: Player) => void;
  setTheme: (theme: "dark" | "light") => void;
};

const PlayerStore = create<Store>()((set) => ({
  player: null,
  theme: "dark",

  setPlayer: (player) => set({ player }),
  setTheme: (theme) => set({ theme }),
}));

export default PlayerStore;
