import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { button as buttonStyles, cn } from "@heroui/theme";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  Bot,
  Controller,
  Group,
  HashIcon,
  Lock,
  Person,
  AlertCircle,
  X,
} from "@/components/icons";
import DefaultLayout from "@/layouts/default";

type Mode = "Online" | "Local" | "Bot";
type Difficulty = "Beginner" | "Medium" | "Hard" | "Expert";

const modeQueryMap: Record<Mode, string> = {
  Online: "online",
  Local: "local",
  Bot: "bot",
};

const modeSections: Array<{
  mode: Mode;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    mode: "Online",
    label: "Online",
    subtitle: "Create a public or private room",
    icon: <Person size={18} />,
  },
  {
    mode: "Local",
    label: "Local",
    subtitle: "Play with two players on one device",
    icon: <Group size={18} />,
  },
  {
    mode: "Bot",
    label: "Bot",
    subtitle: "Practice against computer AI",
    icon: <Bot size={18} />,
  },
];

const difficultyDescriptions: Record<Difficulty, string> = {
  Beginner: "Plays randomly. Great for learning routes and tempo.",
  Medium: "Makes reasonable tactical choices and basic blocks.",
  Hard: "Punishes mistakes and pressures your weak locals.",
  Expert: "Uses deep search and precise endgame strategy.",
};

const parseModeFromQuery = (value: string | null): Mode => {
  if (value === "bot") return "Bot";
  if (value === "local") return "Local";

  return "Online";
};

const CreateRoom = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>("Online");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");

  const [botPlayerName, setBotPlayerName] = useState("Player 1");
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMode(parseModeFromQuery(searchParams.get("mode")));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    params.set("mode", modeQueryMap[mode]);
    setSearchParams(params, { replace: true });
  }, [mode, searchParams, setSearchParams]);

  const title = useMemo(() => {
    if (mode === "Online") return "Create Online Room";
    if (mode === "Local") return "Create Local Match";

    return "Create Bot Match";
  }, [mode]);

  const helperCopy = useMemo(() => {
    if (mode === "Online") {
      return "Start a room and invite others. Choose public visibility or lock it with a password.";
    }

    if (mode === "Local") {
      return "Set player names and play together on this device with alternating turns.";
    }

    return "Pick your preferred difficulty and train against an AI opponent.";
  }, [mode]);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const body =
        mode === "Online"
          ? {
              is_public: isPublic,
              name: roomName,
              password: roomPassword || null,
              room_type: "Standard",
            }
          : mode === "Local"
            ? { room_type: "LocalRoom" }
            : {
                bot_level: difficulty,
                room_type: "BotRoom",
              };

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { message?: string })?.message ??
          "Failed to create room. Please try again.";

        setError(errorMessage);
        setIsLoading(false);

        return;
      }

      const data = await response.json();

      navigate(`/room/${data.room_id}`, {
        state: {
          roomId: data.room_id,
          password: roomPassword,
          isReconnecting: false,
          mode,
          playerNames:
            mode === "Local"
              ? { player1: player1Name, player2: player2Name }
              : mode === "Bot"
                ? { player1: botPlayerName, player2: "Bot" }
                : undefined,
        },
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-12">
          {error && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="border-danger/40 bg-danger/10 flex items-center gap-3 rounded-2xl border p-4"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.16,
                ease: "easeOut" as const,
              }}
            >
              <div className="bg-danger/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <AlertCircle className="text-danger" size={20} />
              </div>
              <p className="text-danger flex-1 text-sm font-medium">{error}</p>
              <button
                className="text-foreground-500 hover:text-foreground shrink-0 transition"
                type="button"
                onClick={() => setError(null)}
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="border-foreground-100/70 bg-content1/85 relative overflow-hidden rounded-2xl border p-5 shadow-lg md:p-7"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.2,
              ease: "easeOut",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_58%)]" />
            <div className="relative flex flex-col gap-2">
              <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
                Match Setup
              </p>
              <h1 className="text-foreground-900 dark:text-foreground text-3xl font-black tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="text-foreground-700 dark:text-foreground-300 max-w-3xl text-sm leading-relaxed md:text-base">
                {helperCopy}
              </p>
            </div>
          </motion.section>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-5 lg:grid-cols-[280px_1fr]"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.22,
              ease: "easeOut",
              delay: prefersReducedMotion ? 0 : 0.03,
            }}
          >
            <aside className="border-foreground-100/70 bg-content1/80 rounded-2xl border p-5 md:p-6 lg:sticky lg:top-8 lg:h-fit">
              <p className="text-foreground-700 dark:text-foreground-300 mb-3 text-xs font-black tracking-[0.12em] uppercase">
                Game Mode
              </p>
              <div className="space-y-2">
                {modeSections.map((item, index) => (
                  <motion.button
                    key={item.mode}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition",
                      mode === item.mode
                        ? "border-primary/45 bg-primary/10"
                        : "border-foreground-100/70 bg-content2/70 hover:border-primary/30 hover:bg-primary/8",
                    )}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                    transition={{
                      duration: prefersReducedMotion ? 0.01 : 0.16,
                      ease: "easeOut",
                      delay: prefersReducedMotion ? 0 : index * 0.03,
                    }}
                    type="button"
                    onClick={() => setMode(item.mode)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{item.icon}</span>
                      <p className="text-foreground-900 dark:text-foreground text-sm font-bold">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-foreground-600 dark:text-foreground-400 mt-1 text-xs leading-relaxed">
                      {item.subtitle}
                    </p>
                  </motion.button>
                ))}
              </div>
            </aside>

            <div className="border-foreground-100/70 bg-content1/80 rounded-2xl border p-5 md:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.18,
                    ease: "easeOut",
                  }}
                >
                  {mode === "Online" && (
                    <>
                      <section className="space-y-4">
                        <h2 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                          Room Setup
                        </h2>
                        <InputGroup htmlFor="room-name" label="Room Name">
                          <div className="group relative">
                            <span className="text-foreground-400 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <HashIcon size={18} />
                            </span>
                            <input
                              required
                              className="border-foreground-100 bg-content2/70 text-foreground-900 dark:text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 pl-10 text-sm transition outline-none"
                              id="room-name"
                              maxLength={50}
                              minLength={3}
                              placeholder="Room name"
                              value={roomName}
                              onChange={(event) =>
                                setRoomName(event.target.value)
                              }
                            />
                          </div>
                        </InputGroup>

                        <InputGroup
                          htmlFor="room-password"
                          label="Room Password (optional)"
                        >
                          <div className="group relative">
                            <span className="text-foreground-400 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Lock size={18} />
                            </span>
                            <input
                              className="border-foreground-100 bg-content2/70 text-foreground-900 dark:text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 pl-10 text-sm transition outline-none"
                              id="room-password"
                              placeholder="Add a password to lock this room"
                              type="password"
                              value={roomPassword}
                              onChange={(event) =>
                                setRoomPassword(event.target.value)
                              }
                            />
                          </div>
                        </InputGroup>
                      </section>

                      <section className="space-y-3">
                        <h2 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                          Visibility
                        </h2>
                        <div className="border-foreground-100/70 bg-content2/70 flex rounded-xl border p-1.5">
                          <button
                            className={cn(
                              "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition",
                              isPublic
                                ? "bg-primary text-white"
                                : "text-foreground-600 dark:text-foreground-400 hover:text-foreground-900 dark:hover:text-foreground",
                            )}
                            type="button"
                            onClick={() => setIsPublic(true)}
                          >
                            Public
                          </button>
                          <button
                            className={cn(
                              "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition",
                              !isPublic
                                ? "bg-primary text-white"
                                : "text-foreground-600 dark:text-foreground-400 hover:text-foreground-900 dark:hover:text-foreground",
                            )}
                            type="button"
                            onClick={() => setIsPublic(false)}
                          >
                            Private
                          </button>
                        </div>
                      </section>
                    </>
                  )}

                  {mode === "Local" && (
                    <section className="space-y-4">
                      <h2 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Players
                      </h2>

                      <InputGroup
                        htmlFor="local-player-1"
                        label="Player 1 Name"
                      >
                        <div className="group relative">
                          <span className="text-foreground-400 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Person size={18} />
                          </span>
                          <input
                            className="border-foreground-100 bg-content2/70 text-foreground-900 dark:text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 pl-10 text-sm transition outline-none"
                            id="local-player-1"
                            placeholder="Player 1 name"
                            value={player1Name}
                            onChange={(event) =>
                              setPlayer1Name(event.target.value)
                            }
                          />
                        </div>
                      </InputGroup>

                      <InputGroup
                        htmlFor="local-player-2"
                        label="Player 2 Name"
                      >
                        <div className="group relative">
                          <span className="text-foreground-400 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Person size={18} />
                          </span>
                          <input
                            className="border-foreground-100 bg-content2/70 text-foreground-900 dark:text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 pl-10 text-sm transition outline-none"
                            id="local-player-2"
                            placeholder="Player 2 name"
                            value={player2Name}
                            onChange={(event) =>
                              setPlayer2Name(event.target.value)
                            }
                          />
                        </div>
                      </InputGroup>

                      <div className="border-foreground-100/70 bg-content2/60 rounded-xl border p-4">
                        <p className="text-foreground-700 dark:text-foreground-300 text-xs leading-relaxed">
                          Local mode runs on one device. Players alternate turns
                          and share the same board.
                        </p>
                      </div>
                    </section>
                  )}

                  {mode === "Bot" && (
                    <>
                      <section className="space-y-4">
                        <h2 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                          Player
                        </h2>

                        <InputGroup htmlFor="bot-player-name" label="Your Name">
                          <div className="group relative">
                            <span className="text-foreground-400 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Person size={18} />
                            </span>
                            <input
                              className="border-foreground-100 bg-content2/70 text-foreground-900 dark:text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 pl-10 text-sm transition outline-none"
                              id="bot-player-name"
                              placeholder="Enter your name"
                              value={botPlayerName}
                              onChange={(event) =>
                                setBotPlayerName(event.target.value)
                              }
                            />
                          </div>
                        </InputGroup>
                      </section>

                      <section className="space-y-3">
                        <InputGroup
                          htmlFor="bot-difficulty"
                          label="Bot Difficulty"
                        >
                          <div
                            className="grid grid-cols-2 gap-2 md:grid-cols-4"
                            id="bot-difficulty"
                          >
                            {(
                              [
                                "Beginner",
                                "Medium",
                                "Hard",
                                "Expert",
                              ] as Difficulty[]
                            ).map((level) => (
                              <button
                                key={level}
                                className={cn(
                                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                                  difficulty === level
                                    ? "border-primary/40 bg-primary/12 text-foreground-900 dark:text-foreground"
                                    : "border-foreground-100 bg-content2/70 text-foreground-700 hover:border-primary/25 hover:bg-primary/8 dark:text-foreground-300",
                                )}
                                type="button"
                                onClick={() => setDifficulty(level)}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </InputGroup>

                        <div className="border-foreground-100/70 bg-content2/60 rounded-xl border p-4">
                          <p className="text-foreground-700 dark:text-foreground-300 text-xs leading-relaxed">
                            {difficultyDescriptions[difficulty]}
                          </p>
                        </div>
                      </section>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="border-foreground-100/70 mt-7 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <button
                  className={buttonStyles({ variant: "flat", radius: "md" })}
                  type="button"
                  onClick={() => navigate("/")}
                >
                  Back
                </button>
                <button
                  className={buttonStyles({ color: "primary", radius: "md" })}
                  disabled={isLoading}
                  type="button"
                  onClick={handleCreate}
                >
                  <Controller size={16} />
                  {isLoading
                    ? "Creating..."
                    : mode === "Online"
                      ? "Create Room"
                      : "Start Game"}
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </DefaultLayout>
  );
};

const InputGroup = ({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label
      className="text-foreground-700 dark:text-foreground-300 ml-1 block text-sm font-semibold"
      htmlFor={htmlFor}
    >
      {label}
    </label>
    {children}
  </div>
);

export default CreateRoom;
