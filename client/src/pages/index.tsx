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

export default function IndexPage() {
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
      <section className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-8 py-8 md:py-10">
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
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-2xl flex-col justify-center gap-4 sm:flex-row sm:gap-6"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            delay: prefersReducedMotion ? 0 : 0.15,
            ease: "easeOut" as const,
          }}
        >
          {/* Play Button */}
          <HomeButton as={Link} to="/create" variant="primary">
            <Controller
              className="transition-transform group-hover:rotate-12"
              size={24}
            />
            Play
          </HomeButton>

          {/* Quick Play Button */}
          <HomeButton as={Link} to="/quick" variant="secondary">
            <LightningIcon
              className="text-slate-400 dark:text-slate-400"
              size={24}
            />
            Quick Play
          </HomeButton>

          {/* Rooms Button */}
          <HomeButton as={Link} to="/rooms" variant="secondary">
            <Group className="text-slate-400 dark:text-slate-400" size={24} />
            Rooms
          </HomeButton>
        </motion.div>

        {/* Divider with Text */}
        <motion.div
          animate={{ opacity: 0.6 }}
          className="flex w-full max-w-lg items-center gap-4 opacity-60"
          initial={{ opacity: 0 }}
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
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            delay: prefersReducedMotion ? 0 : 0.4,
            ease: "easeOut" as const,
          }}
          onSubmit={handleSubmit}
        >
          <div className="dark:shadow-neon-input flex w-full items-center rounded-2xl border border-slate-300 bg-white p-2 pl-4 shadow-sm transition-all duration-300 hover:border-blue-500/60 hover:shadow-md dark:border-blue-500/30 dark:bg-[#020408]">
            <Input
              classNames={{
                base: "flex-grow",
                input:
                  "bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-lg",
                inputWrapper:
                  "bg-transparent border-none shadow-none after:hidden p-0 h-auto min-h-0",
                innerWrapper: "gap-3 items-center py-0",
              }}
              inputMode="numeric"
              maxLength={6}
              name="roomId"
              placeholder="Enter Room ID"
              startContent={
                <KeyboardIcon
                  className="shrink-0 text-slate-400 dark:text-slate-500"
                  size={20}
                />
              }
              value={roomId}
              variant="underlined"
              onValueChange={handleRoomIdInput}
            />
            <button
              className="ml-2 shrink-0 rounded-full bg-blue-600 px-6 py-2 font-bold whitespace-nowrap text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={roomId.length !== 6}
              type="submit"
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
