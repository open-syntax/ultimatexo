import { useParams } from "react-router-dom";
import { FormEvent, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { Link as LinkIcon } from "@/components/icons";
import Board from "@/components/board";
import DefaultLayout from "@/layouts/default";
import { BoardStatus, Board as BoardType, socketEvent } from "@/types";
import RoomLayout from "@/layouts/room";
import { playerActions } from "@/types/actions";
import PlayerStore from "@/store/player";
import RoomStore from "@/store/room";
import Chat from "@/components/chat";
import GameStatus from "@/components/room/status";

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

interface room {
  status: RoomStatus;
  message: string;
}

function RoomPage() {
  let { roomId } = useParams();

  const {
    player,
    setPlayer,
    ws,
    setWs,
    availableBoards,
    setAvailableBoards,
    nextPlayer,
    setNextPlayer,
  } = PlayerStore();

  // const { setRoomId, setPassword, password } = RoomStore();

  const [board, setBoard] = useState<{
    boards: BoardType;
    status: BoardStatus;
  } | null>(null);

  const [status, setStatus] = useState<room>({
    status: RoomStatus.connecting,
    message: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleWebSocket = (password: string) => {
    setWs(new WebSocket(`/api/ws/${roomId}${password ? `:${password}` : ""}`));
  };

  useEffect(() => {
    if (!ws) return;

    let playerId: string | null = null;

    // handle on connection established
    ws.onopen = () => {
      setStatus({ status: RoomStatus.connected, message: "" });
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      // console.log(JSON.parse(event.data));
      const e: socketEvent = JSON.parse(event.data);
      const eventName = e.event;
      console.log(e);

      switch (eventName) {
        case "GameUpdate":
          setBoard(e.data.board);
          setAvailableBoards(e.data.next_board);
          setNextPlayer(e.data.next_player.marker);
          break;

        case "PlayerUpdate":
          let status: RoomStatus, message: string;

          switch (e.data.action) {
            case playerActions.PlayerJoined:
              status = RoomStatus.connected;
              if (playerId && !e.data.player.id) {
                message = "PlayerJoined";
                break;
              } else {
                playerId = e.data.player.id as string;
                setPlayer(e.data.player);
                message = "Connected";
                break;
              }

            case playerActions.PlayerLeft:
              status = RoomStatus.connected;
              message = "Player is Connected";
              break;

            case playerActions.PlayerDisconnected:
              status = RoomStatus.disconnected;
              message = "Disconnected";
              break;

            default:
              status = RoomStatus.error;
              message = "Invalid player action";
              break;
          }

          setStatus({
            status,
            message,
          });
          break;

        case "Ping":
          ws.send(JSON.stringify({ Pong: playerId }));
          break;

        case "Error":
          setStatus({
            status: RoomStatus.error,
            message: e.data.error,
          });
          break;
      }
    };

    // handle on disconnection
    ws.onclose = () => {
      setStatus((state) => ({
        ...state,
        status: RoomStatus.disconnected,
        message: "Cannot connect",
      }));
    };
  }, [ws]);

  const handlePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

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
            You are player: {player.info.marker}
          </p>
          <div className="flex flex-col items-center gap-2">
            <GameStatus boardStatus={board.status} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Board
              board={board.boards}
              nextMove={
                nextPlayer === player.info.marker && board.status === null
                  ? availableBoards
                  : false
              }
            />
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
