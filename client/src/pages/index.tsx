import { useState } from "react";
import { Input } from "@heroui/input";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import {
  Controller,
  Group,
  LightningIcon,
  KeyboardIcon,
} from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function IndexPage() {
  usePageMeta({
    title: "Play Ultimate Tic-Tac-Toe Online",
    description:
      "Play Ultimate Tic-Tac-Toe online for free. Challenge friends, join public rooms, or practice against AI. Nine boards, one champion.",
    path: "/",
  });

  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (roomId.trim() && roomId.length === 6) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleRoomIdInput = (value: string) => {
    setRoomId(value.replace(/[^0-9]/g, ""));
  };

  const fadeInUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: "easeOut" as const,
    },
  };

  return (
    <DefaultLayout pageScrollable>
      <section className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-8 py-4 md:py-6">
        {/* Main Title */}
        <motion.h1
          {...fadeInUp}
          className="text-center text-6xl font-black tracking-tight select-none sm:text-7xl md:text-8xl lg:text-9xl"
        >
          <span className="text-slate-900 dark:text-white">Ultimate</span>
          <span className="text-blue-500">XO</span>
        </motion.h1>

        {/* Primary Action Buttons */}
        <motion.div
          className="flex w-full max-w-2xl flex-col justify-center gap-4 sm:flex-row sm:gap-6"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            delay: prefersReducedMotion ? 0 : 0.15,
            ease: "easeOut" as const,
          }}
        >
          {/* Play Button */}
          <HomeButton as={Link} to="/create" variant="primary">
            <Controller
              size={24}
              className="transition-transform group-hover:rotate-12"
            />
            Play
          </HomeButton>

          {/* Quick Play Button */}
          <HomeButton as={Link} to="/quick" variant="secondary">
            <LightningIcon
              size={24}
              className="text-slate-400 dark:text-slate-400"
            />
            Quick Play
          </HomeButton>

          {/* Rooms Button */}
          <HomeButton as={Link} to="/rooms" variant="secondary">
            <Group size={24} className="text-slate-400 dark:text-slate-400" />
            Rooms
          </HomeButton>
        </motion.div>

        {/* Divider with Text */}
        <motion.div
          className="flex w-full max-w-lg items-center gap-4 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.6,
            delay: prefersReducedMotion ? 0 : 0.3,
            ease: "easeOut" as const,
          }}
        >
          <div className="h-px flex-grow bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700" />
          <span className="text-xs font-bold tracking-widest whitespace-nowrap text-slate-500 uppercase">
            Join an existing game
          </span>
          <div className="h-px flex-grow bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700" />
        </motion.div>

        {/* Room Entry Section */}
        <motion.form
          className="w-full max-w-lg"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            delay: prefersReducedMotion ? 0 : 0.4,
            ease: "easeOut" as const,
          }}
        >
          <div className="dark:shadow-neon-input flex w-full items-center rounded-2xl border border-slate-300 bg-white p-2 pl-4 shadow-sm transition-all duration-300 hover:border-blue-500/60 hover:shadow-md dark:border-blue-500/30 dark:bg-[#020408]">
            <Input
              name="roomId"
              value={roomId}
              onValueChange={handleRoomIdInput}
              placeholder="Enter Room ID"
              variant="underlined"
              inputMode="numeric"
              maxLength={6}
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
              disabled={roomId.length !== 6}
              className="ml-2 shrink-0 rounded-full bg-blue-600 px-6 py-2 font-bold whitespace-nowrap text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </motion.form>
      </section>

      <Footer />
    </DefaultLayout>
  );
}
