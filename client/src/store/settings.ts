import { create } from "zustand";

interface Settings {
  soundEnabled: boolean;
  focusMode: boolean;
  reducedMotion: boolean;
}

function loadSettings(): Partial<Settings> {
  try {
    const raw = localStorage.getItem("ultimatexo-settings");

    return raw ? (JSON.parse(raw) as Partial<Settings>) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem("ultimatexo-settings", JSON.stringify(settings));
  } catch {
    // silently ignore storage errors
  }
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const defaults: Settings = {
  soundEnabled: true,
  focusMode: true,
  reducedMotion: prefersReducedMotion,
};

const initial = { ...defaults, ...loadSettings() };

type Store = Settings & {
  setSoundEnabled: (v: boolean) => void;
  setFocusMode: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
};

export const SettingsStore = create<Store>()((set, get) => ({
  ...initial,

  setSoundEnabled: (v) => {
    set({ soundEnabled: v });
    saveSettings(get());
  },
  setFocusMode: (v) => {
    set({ focusMode: v });
    saveSettings(get());
  },
  setReducedMotion: (v) => {
    set({ reducedMotion: v });
    saveSettings(get());
  },
}));
