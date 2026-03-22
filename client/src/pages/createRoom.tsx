import { useState } from "react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Person,
  Group,
  Bot,
  Lock,
  InfoIcon,
  HashIcon,
} from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { cn } from "@heroui/theme";

type Mode = "Online" | "Local" | "Bot";
type Difficulty = "Beginner" | "Medium" | "Hard" | "Expert";

const CreateRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("Online");
  const [isLoading, setIsLoading] = useState(false);

  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");

  const [botPlayerName, setBotPlayerName] = useState("Player 1");
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");

  useEffect(() => {
    const requestedMode = searchParams.get("mode");

    if (requestedMode === "bot") {
      setMode("Bot");
    }
  }, [searchParams]);

  const difficultyDescriptions: Record<Difficulty, string> = {
    Beginner: "Plays randomly. Good for learning the rules.",
    Medium: "Uses basic strategy. Can be beaten with care.",
    Hard: "Strong opponent. Punishes mistakes.",
    Expert: "Minimax algorithm with full depth. Extremely hard.",
  };

  const handleCreate = async () => {
    setIsLoading(true);
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

      if (response.ok) {
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
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create room:", errorData);
      }
    } catch (error) {
      console.error("Failed to create room", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-300 dark:border-white/5 dark:bg-[#0f172a] dark:shadow-2xl dark:shadow-black/50">
          <h2 className="block border-b border-gray-200 bg-gray-50 p-6 text-center text-2xl font-bold tracking-tight text-gray-800 md:hidden dark:border-white/5 dark:bg-[#020408] dark:text-gray-100">
            {mode === "Online"
              ? "Create Online Room"
              : mode === "Local"
                ? "Create Local Game"
                : "Create Bot Game"}
          </h2>
          <div className="flex h-full min-h-[500px] flex-col md:flex-row">
            <div className="flex w-full flex-col justify-center gap-4 border-gray-200 bg-gray-50 p-6 md:w-1/3 md:border-r dark:border-white/5 dark:bg-[#020408]">
              <SidebarItem
                active={mode === "Online"}
                icon={<Person size={24} />}
                label="Online"
                onClick={() => setMode("Online")}
              />

              <SidebarItem
                active={mode === "Local"}
                icon={<Group size={24} />}
                label="Local"
                onClick={() => setMode("Local")}
              />
              <SidebarItem
                active={mode === "Bot"}
                icon={<Bot size={24} />}
                label="Bot"
                onClick={() => setMode("Bot")}
              />
            </div>

            <div className="relative flex w-full flex-col p-8 md:w-2/3">
              <h2 className="mb-10 hidden text-center text-3xl font-bold tracking-tight text-gray-800 md:block dark:text-gray-100">
                {mode === "Online"
                  ? "Create Room"
                  : mode === "Local"
                    ? "Create Local Game"
                    : "Create Bot Game"}
              </h2>

              <div className="flex flex-grow flex-col space-y-6">
                {mode === "Online" && (
                  <>
                    <InputGroup label="Room Name">
                      <div className="group relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <HashIcon size={20} />
                        </span>
                        <input
                          className="focus:border-primary focus:ring-primary/50 w-full rounded-xl border border-blue-900/30 bg-gray-100 px-4 py-3.5 pl-10 text-gray-900 transition-all outline-none focus:ring-2 dark:border-blue-800/30 dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-600"
                          placeholder="Enter room name..."
                          value={roomName}
                          required
                          minLength={3}
                          maxLength={50}
                          onChange={(e) => setRoomName(e.target.value)}
                        />
                      </div>
                    </InputGroup>
                    <InputGroup label="Room Password">
                      <div className="group relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <Lock size={20} />
                        </span>
                        <input
                          className="focus:border-primary focus:ring-primary/50 w-full rounded-xl border border-blue-900/30 bg-gray-100 px-4 py-3.5 pl-10 text-gray-900 transition-all outline-none focus:ring-2 dark:border-blue-800/30 dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-600"
                          placeholder="Enter password (optional)..."
                          type="password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                        />
                      </div>
                    </InputGroup>
                    <div className="mt-6 flex rounded-xl bg-gray-200 p-1 dark:border dark:border-blue-900/30 dark:bg-[#0f172a]">
                      <button
                        className={cn(
                          "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                          isPublic
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                        )}
                        onClick={() => setIsPublic(true)}
                      >
                        Public
                      </button>
                      <button
                        className={cn(
                          "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                          !isPublic
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                        )}
                        onClick={() => setIsPublic(false)}
                      >
                        Private
                      </button>
                    </div>
                  </>
                )}

                {mode === "Local" && (
                  <>
                    <InputGroup label="Player 1 Name">
                      <div className="group relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <Person size={20} />
                        </span>
                        <input
                          className="focus:border-primary focus:ring-primary/50 w-full rounded-xl border border-blue-900/30 bg-gray-100 px-4 py-3.5 pl-10 text-gray-900 transition-all outline-none focus:ring-2 dark:border-blue-800/30 dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-600"
                          placeholder="Enter name..."
                          value={player1Name}
                          onChange={(e) => setPlayer1Name(e.target.value)}
                        />
                      </div>
                    </InputGroup>
                    <div className="-my-1 flex items-center justify-center opacity-50">
                      <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                      <span className="px-3 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400">
                        VS
                      </span>
                      <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <InputGroup label="Player 2 Name">
                      <div className="group relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <Person size={20} />
                        </span>
                        <input
                          className="focus:border-primary focus:ring-primary/50 w-full rounded-xl border border-blue-900/30 bg-gray-100 px-4 py-3.5 pl-10 text-gray-900 transition-all outline-none focus:ring-2 dark:border-blue-800/30 dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-600"
                          placeholder="Enter name..."
                          value={player2Name}
                          onChange={(e) => setPlayer2Name(e.target.value)}
                        />
                      </div>
                    </InputGroup>
                    <div className="mt-4 rounded-lg border border-blue-900/20 bg-gray-50 p-4 dark:border-blue-800/20 dark:bg-[#1e293b]/50">
                      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <InfoIcon size={16} />
                        <span className="font-medium">Match Details</span>
                      </div>
                      <p className="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        This game will be played on the current device. Players
                        will take turns making moves.
                      </p>
                    </div>
                  </>
                )}

                {mode === "Bot" && (
                  <>
                    <InputGroup label="Player Name">
                      <div className="group relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          <Person size={20} />
                        </span>
                        <input
                          className="focus:border-primary focus:ring-primary/50 w-full rounded-xl border border-blue-900/30 bg-gray-100 px-4 py-3.5 pl-10 text-gray-900 transition-all outline-none focus:ring-2 dark:border-blue-800/30 dark:bg-[#1e293b] dark:text-white dark:placeholder-gray-600"
                          placeholder="Enter your name..."
                          value={botPlayerName}
                          onChange={(e) => setBotPlayerName(e.target.value)}
                        />
                      </div>
                    </InputGroup>
                    <div className="space-y-3">
                      <label className="ml-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                        Bot Difficulty
                      </label>
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-blue-900/30 bg-gray-100 p-1.5 md:grid-cols-4 dark:border-blue-800/30 dark:bg-[#0f172a]">
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
                              "relative z-10 w-full rounded-lg py-2.5 text-center text-sm font-medium transition-all",
                              difficulty === level
                                ? "bg-primary text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                            )}
                            onClick={() => setDifficulty(level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <p className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                        {difficultyDescriptions[difficulty]}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-12 flex gap-4 pt-4">
                <button
                  className="flex-1 rounded-xl bg-gray-200 py-3.5 font-semibold text-gray-900 transition-colors duration-200 hover:bg-gray-300 dark:border dark:border-blue-900/30 dark:bg-[#1e293b] dark:text-white dark:hover:bg-[#334155]"
                  onClick={() => navigate("/")}
                >
                  Back
                </button>
                <button
                  className="bg-primary flex-1 transform rounded-xl py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 active:translate-y-0 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={handleCreate}
                >
                  {isLoading
                    ? "Creating..."
                    : mode === "Online"
                      ? "Create"
                      : "Start Game"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

const SidebarItem = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={cn(
      "group relative flex w-full items-center justify-between rounded-xl p-4 transition-all duration-300",
      active
        ? "bg-primary scale-[1.02] transform text-white shadow-[0_0_20px_rgba(0,122,255,0.3)]"
        : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-[#1e293b] dark:text-gray-400 dark:hover:bg-[#334155]",
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-lg font-semibold">{label}</span>
    </div>
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full border-2",
        active
          ? "border-white"
          : "border-gray-400 group-hover:border-gray-500 dark:border-gray-600",
      )}
    >
      {active && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
    </div>
    {active && (
      <div className="bg-primary absolute inset-0 -z-10 rounded-xl opacity-50 blur-lg transition-opacity group-hover:opacity-70" />
    )}
  </button>
);

const InputGroup = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="ml-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </label>
    {children}
  </div>
);

export default CreateRoom;
