import { useLocation, useParams, Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { Link as LinkIcon } from "@/components/icons";
import Board from "@/components/room/board";
import DefaultLayout from "@/layouts/default";
import RoomLayout from "@/layouts/room";
import Chat from "@/components/room/chat";
import GameStatus from "@/components/room/status";
import useGame from "@/hooks/useGame";
import { RoomStore } from "@/store";
import Actions from "@/components/room/actions";

interface roomResponse {
  id: string;
  name: string;
  bot_level: null | "Beginner" | "Intermediate" | "Advanced";
  is_public: boolean;
  is_protected: boolean;
}

enum RoomStatus {
  loading = "loading",
  connected = "connected",
  disconnected = "disconnected",
  opponentLeft = "opponent left",
  connecting = "connecting",
  internal = "internal",
  error = "error",
  auth = "auth required",
  authFailed = "auth failed",
  notFound = "room not found",
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

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleWebSocket = useCallback(
    (password: string) => {
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

    const checkRoom = () => {
      fetch(`/api/room/${roomId}`)
        .then((response) => {
          if (response.ok) {
            const res = response.json();

            res.then((data: roomResponse) => {
              if (!data.is_protected) {
                handleWebSocket("");
              } else {
                setStatus({ status: RoomStatus.auth, message: "" });
              }
            });
          } else if (response.status === 404) {
            return setStatus({
              status: RoomStatus.notFound,
              message: "Room Not Found",
            });
          }
        })
        .finally(() => setIsLoading(false));
    };

    checkRoom();
  }, [roomId, handleWebSocket, setStatus]);

  if (status.status === RoomStatus.connecting || isLoading) {
    return (
      <DefaultLayout>
        <div className="difficultyflex-grow container mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-2 px-6">
          <Spinner />
          <p>Connecting...</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      {[
        RoomStatus.disconnected,
        RoomStatus.opponentLeft,
        RoomStatus.error,
      ].includes(status.status) ? (
        <RoomLayout>
          {status.message}
          <div className="flex gap-3">
            <Link className={buttonStyles({ variant: "bordered" })} to="/">
              Home
            </Link>
            <Link className={buttonStyles({ color: "primary" })} to="/rooms">
              Rooms
            </Link>
          </div>
        </RoomLayout>
      ) : (status.status === RoomStatus.auth &&
          !(state?.password && roomId === state?.roomId)) ||
        status.status === RoomStatus.authFailed ? (
        <RoomLayout>
          <form
            className="flex w-full max-w-80 flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleWebSocket(e.currentTarget.password.value);
            }}
          >
            Room is protected
            <Input
              isRequired
              errorMessage={status.message}
              isInvalid={status.status === RoomStatus.authFailed}
              name="password"
              placeholder="password"
              type="password"
              onChange={() =>
                setStatus({ status: RoomStatus.auth, message: "" })
              }
            />
            <Button className="w-full" color="primary" type="submit">
              Verify
            </Button>
          </form>
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
          <h3>Waiting for player to join.</h3>
          <div className="flex gap-3">
            <Button
              variant="bordered"
              onPress={() => {
                navigator.clipboard.writeText(roomId as string);
              }}
            >
              Room ID: <b>{roomId}</b>
            </Button>
            <Button
              color="primary"
              onPress={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              Copy Link <LinkIcon size={20} />
            </Button>
          </div>
        </RoomLayout>
      )}
    </DefaultLayout>
  );
}

export default RoomPage;
