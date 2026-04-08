import { useLocation, useParams, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { motion, useReducedMotion } from "framer-motion";

import {
  Link as LinkIcon,
  Check,
  Copy,
  AlertCircle,
  WifiOff,
} from "@/components/icons";
import Board from "@/components/room/board";
import DefaultLayout from "@/layouts/default";
import RoomLayout from "@/layouts/room";
import Chat from "@/components/room/chat";
import GameStatus from "@/components/room/status";
import useGame from "@/hooks/useGame";
import { RoomStore } from "@/store";
import Actions from "@/components/room/actions";
import { RoomStatus } from "@/types";
import { usePageMeta } from "@/hooks/usePageMeta";

interface roomResponse {
  id: string;
  name: string;
  bot_level: null | "Beginner" | "Intermediate" | "Advanced";
  is_public: boolean;
  is_protected: boolean;
}

function RoomPage() {
  let { roomId } = useParams();
  const { player, board, status, score, rematchStatus, drawStatus, setStatus } =
    useGame();
  const { setWs, setMode } = RoomStore();
  let { state } = useLocation() as unknown as {
    state: {
      roomId: string;
      password?: string;
      isReconnecting: boolean;
      mode: "Online" | "Local" | "Bot";
      playerNames?: {
        player1?: string;
        player2?: string;
      };
    } | null;
  };

  usePageMeta({
    title: `Room ${roomId} - Live Game`,
    description: `Join Ultimate Tic-Tac-Toe room ${roomId}. Play a live multiplayer game online.`,
    path: `/room/${roomId}`,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<"id" | "link" | null>(null);
  const [password, setPassword] = useState("");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async (text: string, field: "id" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const handleWebSocket = useCallback(
    (password: string) => {
      const existingWs = RoomStore.getState().ws;
      if (existingWs) {
        existingWs.close();
      }

      const room_id = sessionStorage.getItem("roomId");
      const player_id = sessionStorage.getItem("playerId");

      const params = [];

      if (room_id && room_id === roomId) {
        params.push(`is_reconnecting=true`);
      }

      if (password) {
        params.push(`password=${password}`);
      }

      if (player_id) {
        params.push(`player_id=${player_id}`);
      }

      setWs(
        new WebSocket(
          `/ws/${roomId}${params.length >= 1 ? `?${params.join("&")}` : ""}`,
        ),
      );
    },
    [roomId, setWs],
  );

  useEffect(() => {
    if (!state) return;

    if (state.password && roomId === state.roomId) {
      setIsLoading(false);
      handleWebSocket(state.password);
    }

    setMode(state.mode);
  }, [state, roomId, setMode, handleWebSocket]);

  useEffect(() => {
    if (!roomId) return;

    const controller = new AbortController();

    const checkRoom = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = (await response.json()) as roomResponse;
          if (!data.is_protected) {
            handleWebSocket("");
          } else {
            setStatus({ status: RoomStatus.auth, message: "" });
          }
        } else if (response.status === 404) {
          setStatus({
            status: RoomStatus.notFound,
            message: "Room Not Found",
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          // silently ignore aborted requests
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    checkRoom();

    return () => {
      controller.abort();
    };
  }, [roomId, handleWebSocket, setStatus]);

  const motionProps = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: prefersReducedMotion ? 0.01 : 0.25,
      ease: "easeOut" as const,
    },
  };

  if (status.status === RoomStatus.connecting || isLoading) {
    return (
      <DefaultLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="animate-ping-slow bg-primary/20 absolute inset-0 rounded-full" />
              <Spinner size="lg" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-foreground-900 dark:text-foreground text-lg font-semibold">
                {isLoading ? "Verifying room..." : "Establishing connection..."}
              </p>
              <p className="text-foreground-500 text-sm">
                {isLoading
                  ? "Checking if the room exists"
                  : "Connecting to game server"}
              </p>
            </div>
          </motion.div>
        </div>
      </DefaultLayout>
    );
  }

  const isErrorState = [
    RoomStatus.disconnected,
    RoomStatus.opponentLeft,
    RoomStatus.error,
  ].includes(status.status);

  const isDisconnected = status.status === RoomStatus.disconnected;
  const isOpponentLeft = status.status === RoomStatus.opponentLeft;

  return (
    <DefaultLayout>
      {isErrorState ? (
        <RoomLayout>
          <motion.div
            {...motionProps}
            className="border-danger/40 bg-danger/10 flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-6 text-center"
          >
            <div className="bg-danger/20 flex h-14 w-14 items-center justify-center rounded-full">
              {isDisconnected ? (
                <WifiOff className="text-danger" size={28} />
              ) : (
                <AlertCircle className="text-danger" size={28} />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                {isDisconnected
                  ? "Connection Lost"
                  : isOpponentLeft
                    ? "Opponent Left"
                    : "Something went wrong"}
              </h2>
              <p className="text-foreground-600 dark:text-foreground-400 text-sm">
                {status.message}
              </p>
            </div>
            <div className="flex gap-3">
              <Link className={buttonStyles({ variant: "bordered" })} to="/">
                Home
              </Link>
              <Link className={buttonStyles({ color: "primary" })} to="/rooms">
                Rooms
              </Link>
            </div>
          </motion.div>
        </RoomLayout>
      ) : (status.status === RoomStatus.auth &&
          !(state?.password && roomId === state?.roomId)) ||
        status.status === RoomStatus.authFailed ? (
        <RoomLayout>
          <motion.div
            {...motionProps}
            className="flex w-full max-w-80 flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                Protected Room
              </h2>
              <p className="text-foreground-500 text-sm">
                This room requires a password to join.
              </p>
            </div>
            <form
              className={`flex w-full flex-col gap-4 ${status.status === RoomStatus.authFailed ? "animate-shake" : ""}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleWebSocket(password);
              }}
            >
              <Input
                isRequired
                autoFocus
                errorMessage={
                  status.status === RoomStatus.authFailed ? status.message : ""
                }
                isInvalid={status.status === RoomStatus.authFailed}
                name="password"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status.status === RoomStatus.authFailed) {
                    setStatus({ status: RoomStatus.auth, message: "" });
                  }
                }}
              />
              <Button className="w-full" color="primary" type="submit">
                Verify & Join
              </Button>
            </form>
          </motion.div>
        </RoomLayout>
      ) : board && player ? (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_28%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_82%_72%,rgba(244,63,94,0.14),transparent_50%)]" />
          <div className="relative container mx-auto flex h-full max-w-7xl flex-col gap-3 px-5 pb-1 lg:gap-4 lg:px-6">
            <GameStatus
              boardStatus={board.status}
              drawStatus={drawStatus}
              player={player}
              playerNames={state?.playerNames}
              rematchStatus={rematchStatus}
              score={score}
            />
            <div className="flex min-h-0 flex-1 items-center justify-center gap-3 lg:gap-4">
              <Board
                board={board}
                className="max-h-[56vh] max-w-[min(100%,38rem)] xl:max-h-[58vh] xl:max-w-[min(100%,40rem)]"
              />
              <Chat />
            </div>
            <Actions
              boardStatus={board.status}
              drawStatus={drawStatus}
              rematchStatus={rematchStatus}
            />
          </div>
        </div>
      ) : (
        <RoomLayout>
          <motion.div
            {...motionProps}
            className="flex w-full max-w-md flex-col items-center gap-6 text-center"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative mb-2">
                <div className="animate-ping-slow bg-primary/20 absolute inset-0 rounded-full" />
                <div className="bg-primary/15 flex h-16 w-16 items-center justify-center rounded-full">
                  <span className="text-primary text-2xl font-black">
                    {player?.marker ?? "?"}
                  </span>
                </div>
              </div>
              <h2 className="text-foreground-900 dark:text-foreground text-2xl font-bold">
                Waiting for opponent
              </h2>
              <p className="text-foreground-500 text-sm">
                Share the room ID or link to invite someone to play.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                fullWidth
                variant="bordered"
                onPress={() => handleCopy(roomId as string, "id")}
                startContent={
                  copiedField === "id" ? (
                    <Check className="text-success" size={18} />
                  ) : (
                    <Copy size={18} />
                  )
                }
              >
                {copiedField === "id" ? (
                  <span className="text-success">Copied!</span>
                ) : (
                  <>
                    Room ID: <b>{roomId}</b>
                  </>
                )}
              </Button>
              <Button
                fullWidth
                color="primary"
                onPress={() => handleCopy(window.location.href, "link")}
                startContent={
                  copiedField === "link" ? (
                    <Check className="text-white" size={18} />
                  ) : (
                    <LinkIcon size={18} />
                  )
                }
              >
                {copiedField === "link" ? "Copied!" : "Copy Invite Link"}
              </Button>
            </div>
          </motion.div>
        </RoomLayout>
      )}
    </DefaultLayout>
  );
}

export default RoomPage;
