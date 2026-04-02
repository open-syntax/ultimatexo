import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { motion, useReducedMotion } from "framer-motion";

import DefaultLayout from "@/layouts/default";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Status {
  state: "loading" | "notfound" | "completed" | "error";
  message: string;
}

function Quick() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  usePageMeta({
    title: "Quick Play - Instant Game Match",
    description:
      "Jump into a random Ultimate Tic-Tac-Toe game instantly. No setup required - we'll match you with an active room or AI opponent.",
    path: "/quick",
  });

  const [status, setStatus] = useState<Status>({
    state: "loading",
    message: "Searching for available rooms",
  });
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const attempts = useRef(0);

  const motionProps = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: prefersReducedMotion ? 0.01 : 0.25,
      ease: "easeOut" as const,
    },
  };

  const fetchRooms = async () => {
    attempts.current++;

    try {
      const res = await fetch("/api/rooms");

      if (!res.ok) {
        throw new Error("Failed to fetch rooms");
      }

      let data = (await res.json()) as { id: string; is_protected: boolean }[];

      data = data.filter((room) => !room.is_protected);

      const len = data.length;

      if (len === 0) {
        if (attempts.current < 3) {
          setStatus({
            state: "loading",
            message: `Attempt ${attempts.current} of 3 — retrying in 5s...`,
          });

          setTimeout(() => fetchRooms(), 5000);
        } else {
          setStatus({
            state: "notfound",
            message: "No rooms found. Would you like to play against AI?",
          });
        }
      } else {
        const rand = Math.floor(Math.random() * len);
        const room = data[rand];

        navigate(`/room/${room.id}`);
      }
    } catch {
      setStatus({
        state: "error",
        message:
          "Unable to connect. Please check your connection and try again.",
      });
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const createBotRoom = async () => {
    setIsCreatingBot(true);

    try {
      const res = await fetch(`/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bot_level: "Beginner",
          room_type: "BotRoom",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create bot room");
      }

      const data = (await res.json()) as { room_id: number };

      navigate(`/room/${data.room_id}`);
    } catch {
      setStatus({
        state: "error",
        message: "Failed to create bot room. Please try again.",
      });
      setIsCreatingBot(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex h-full flex-col items-center justify-center gap-6">
        {status.state === "loading" ? (
          <motion.div
            {...motionProps}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="animate-ping-slow bg-primary/20 absolute inset-0 rounded-full" />
              <Spinner size="lg" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-foreground-900 dark:text-foreground text-lg font-semibold">
                {status.message}
              </p>
              <p className="text-foreground-500 text-sm">
                Looking for an active room to join
              </p>
            </div>
          </motion.div>
        ) : status.state === "error" ? (
          <motion.div
            {...motionProps}
            className="border-danger/40 bg-danger/10 flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-6 text-center"
          >
            <div className="bg-danger/20 flex h-14 w-14 items-center justify-center rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-danger"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                Connection Error
              </h2>
              <p className="text-foreground-600 dark:text-foreground-400 text-sm">
                {status.message}
              </p>
            </div>
            <Button
              color="primary"
              onPress={() => {
                attempts.current = 0;
                setStatus({
                  state: "loading",
                  message: "Searching for available rooms",
                });
                fetchRooms();
              }}
            >
              Try Again
            </Button>
          </motion.div>
        ) : status.state === "notfound" ? (
          <motion.div
            {...motionProps}
            className="flex w-full max-w-md flex-col items-center gap-6 text-center"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground-900 dark:text-foreground text-2xl font-bold">
                No rooms available
              </h2>
              <p className="text-foreground-500 text-sm">{status.message}</p>
            </div>
            <div className="flex gap-3">
              <Button
                color="primary"
                isLoading={isCreatingBot}
                onPress={createBotRoom}
              >
                Yes, play vs AI
              </Button>
              <Button
                variant="bordered"
                onPress={() => {
                  attempts.current = 0;
                  setStatus({
                    state: "loading",
                    message: "Searching for available rooms",
                  });
                  fetchRooms();
                }}
              >
                Retry
              </Button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </DefaultLayout>
  );
}

export default Quick;
