import { useLocation, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const { player, board, status, rematchStatus, setStatus } = useGame();
  const { setWs, setMode } = RoomStore();
  let { state } = useLocation();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (state?.password && roomId === state?.roomId) {
      setIsLoading(false);
      handleWebSocket(state.password);
    }

    if (state?.mode) {
      setMode(state.mode);
    }
  }, [state]);

  const handleWebSocket = (password: string) => {
    // if the room id is the same as the one in the session storage, we can reuse the websocket
    const room_id = sessionStorage.getItem("room_id");

    const params = [];

    if (room_id && room_id === roomId) {
      params.push(`room_id=${room_id}`);
    }

    if (password) {
      params.push(`password=${password}`);
    }

    if (player?.id) {
      params.push(`player_id=${player.id}`);
    }

    setWs(
      new WebSocket(
        `/api/ws/${roomId}${params.length >= 1 ? `?${params.join("&")}` : ""}`,
      ),
    );
  };

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

    return checkRoom();
  }, [roomId]);

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
      ) : status.status === RoomStatus.auth ||
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
        <div className="container mx-auto my-auto flex h-[calc(100svh-64px-48px-64px)] max-w-7xl flex-grow flex-col justify-center gap-4 px-6">
          <div className="flex flex-col items-center gap-2">
            <GameStatus
              boardStatus={board.status}
              player={player}
              rematchStatus={rematchStatus}
            />
          </div>
          <div>
            <Board board={board} />
            <Chat />
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
