import { FC, useState, useEffect } from "react";
import { useTheme } from "@heroui/use-theme";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import { PlayerStore } from "@/store";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);

  const { setTheme: setCurrentTheme } = PlayerStore();
  const { theme, setTheme } = useTheme();

  const isLight = theme === "light";

  const toggleTheme = () => {
    setTheme(isLight ? "dark" : "light");
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setCurrentTheme(theme as "light" | "dark");
  }, [theme, setCurrentTheme]);

  // Prevent Hydration Mismatch
  if (!isMounted) {
    return (
      <div className="h-10 w-10 rounded-lg border border-slate-200 bg-white dark:border-white/5 dark:bg-slate-800/60" />
    );
  }

  return (
    <button
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300 ${
        isLight
          ? "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
          : "border-white/5 bg-slate-800/60 text-yellow-400 hover:border-yellow-500/30 hover:bg-slate-700 hover:text-yellow-300"
      } ${className || ""}`}
      onClick={toggleTheme}
    >
      {isLight ? <MoonFilledIcon size={20} /> : <SunFilledIcon size={20} />}
    </button>
  );
};
