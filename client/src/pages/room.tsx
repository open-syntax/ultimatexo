import { useParams, useSearchParams } from "react-router-dom";
import { FormEvent, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Link } from "@heroui/link";
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
  error = "error",
  auth = "auth required",
  authFailed = "auth failed",
  notFound = "room not found",
}

function RoomPage() {
  let { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { player, board, status, rematchStatus, setStatus } = useGame();
  const { setWs } = RoomStore();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (searchParams.get("password")) {
      setSearchParams({});
      handleWebSocket(searchParams.get("password") || "");
    }
  }, [searchParams]);

  const handleWebSocket = (password: string) => {
    // if the room id is the same as the one in the session storage, we can reuse the websocket
    const room_id = sessionStorage.getItem("roomId") || null;

    if (room_id && room_id === roomId) {
      setWs(
        new WebSocket(
          `/api/ws/${roomId}${password ? `:${password}?is_reconnecting=true` : `?is_reconnecting=true`}`,
        ),
      );

      return;
    }

    setWs(new WebSocket(`/api/ws/${roomId}${password ? `:${password}` : ""}`));
  };

  const handlePassword = (e?: FormEvent<HTMLFormElement>, pass?: string) => {
    e?.preventDefault();
    let password: string;

    if (!pass) {
      const formData = new FormData(e?.currentTarget);

      password = formData.get("password") as string;
    } else {
      password = pass;
    }

    fetch(`/api/room/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.valid) {
          handleWebSocket(password);
        } else {
          setStatus({
            status: RoomStatus.authFailed,
            message: "Wrong password",
          });
        }
        // console.log(data);
      });
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
        <div className="container mx-auto flex h-full max-w-7xl flex-grow flex-col items-center justify-center gap-2 px-6">
          <Spinner />
          <p>Connecting...</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      {status.status === RoomStatus.disconnected ? (
        <RoomLayout>
          {status.message}
          <div className="flex gap-3">
            <Link className={buttonStyles({ variant: "bordered" })} href="/">
              Home
            </Link>
            <Link className={buttonStyles({ color: "primary" })} href="/rooms">
              Rooms
            </Link>
          </div>
        </RoomLayout>
      ) : status.status === RoomStatus.auth ? (
        <RoomLayout>
          <form
            className="flex w-full max-w-80 flex-col gap-4"
            onSubmit={(e) => handlePassword(e)}
          >
            Room is protected
            <Input
              isRequired
              name="password"
              placeholder="password"
              type="password"
            />
            <Button className="w-full" color="primary" type="submit">
              Verify
            </Button>
          </form>
        </RoomLayout>
      ) : board ? (
        <div className="container mx-auto my-auto flex h-[calc(100svh-64px-48px-64px)] max-w-7xl flex-grow flex-col justify-center gap-4 px-6">
          <p className="w-full text-center font-semibold">
            You are player: {player}
          </p>
          <div className="flex flex-col items-center gap-2">
            <GameStatus
              boardStatus={board.status}
              rematchStatus={rematchStatus}
            />
          </div>
          <div>
            <Board board={board.boards} />
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
