import { Input } from "@heroui/input";
import { useNavigate, Link } from "react-router-dom";

import {
  Controller,
  Group,
  LightningIcon,
  KeyboardIcon,
} from "@/components/icons";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);
    const roomId = data.get("roomId") as string;

    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  // Filter non-numeric characters from Room ID input
  const handleRoomIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };

  return (
    <DefaultLayout>
      <section className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-8 py-8 md:py-10">
        {/* Main Title - Theme-aware glow effect */}
        <h1 className="text-glow-strong text-center text-6xl font-black tracking-tight select-none sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="text-slate-900 dark:text-white">Ultimate</span>
          <span className="text-blue-500">XO</span>
        </h1>

        {/* Primary Action Buttons */}
        <div className="flex w-full max-w-2xl flex-col justify-center gap-4 sm:flex-row sm:gap-6">
          {/* Play Button */}
          <Link
            to="/create"
            className="group dark:shadow-neon dark:hover:shadow-neon-hover flex flex-1 transform items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-xl sm:px-8 sm:py-5 sm:text-xl"
          >
            <Controller
              size={24}
              className="transition-transform group-hover:rotate-12"
            />
            Play
          </Link>

          {/* Quick Play Button */}
          <Link
            to="/quick"
            className="flex flex-1 transform items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-bold text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-blue-50 sm:px-8 sm:py-5 sm:text-xl dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-blue-900/10"
          >
            <LightningIcon
              size={24}
              className="text-slate-400 dark:text-slate-400"
            />
            Quick Play
          </Link>

          {/* Rooms Button */}
          <Link
            to="/rooms"
            className="flex flex-1 transform items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-bold text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-blue-50 sm:px-8 sm:py-5 sm:text-xl dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-blue-900/10"
          >
            <Group size={24} className="text-slate-400 dark:text-slate-400" />
            Rooms
          </Link>
        </div>

        {/* Divider with Text */}
        <div className="flex w-full max-w-lg items-center gap-4 opacity-60">
          <div className="h-px flex-grow bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700" />
          <span className="text-xs font-bold tracking-widest whitespace-nowrap text-slate-500 uppercase">
            Join an existing game
          </span>
          <div className="h-px flex-grow bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700" />
        </div>

        {/* Room Entry Section */}
        <form className="w-full max-w-lg" onSubmit={(e) => handleSubmit(e)}>
          <div className="dark:shadow-neon-input flex w-full items-center rounded-2xl border border-slate-300 bg-white p-2 pl-4 shadow-sm transition-all duration-300 hover:border-blue-500/60 hover:shadow-md dark:border-blue-500/30 dark:bg-[#020408]">
            <Input
              name="roomId"
              placeholder="Enter Room ID"
              variant="underlined"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              onInput={handleRoomIdInput}
              startContent={
                <KeyboardIcon
                  size={20}
                  className="shrink-0 text-slate-400 dark:text-slate-500"
                />
              }
              classNames={{
                base: "flex-grow",
                input:
                  "bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-lg",
                inputWrapper:
                  "bg-transparent border-none shadow-none after:hidden p-0 h-auto min-h-0",
                innerWrapper: "gap-3 items-center py-0",
              }}
            />
            <button
              type="submit"
              className="ml-2 shrink-0 rounded-full bg-blue-600 px-6 py-2 font-bold whitespace-nowrap text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-500"
            >
              Join
            </button>
          </div>
        </form>
      </section>
    </DefaultLayout>
  );
}
