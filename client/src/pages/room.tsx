import { useParams } from "react-router-dom";
import { FormEvent, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";

import { Link as LinkIcon } from "@/components/icons";
import Board from "@/components/board";
import DefaultLayout from "@/layouts/default";
import { Board as BoardType, socketEvent } from "@/types";
import RoomLayout from "@/layouts/room";
import { Input } from "@heroui/input";

let ws: WebSocket;

interface roomResponse {
  id: string;
  name: string;
  bot_level: null | "Beginner" | "Intermediate" | "Advanced";
  is_public: boolean;
  is_protected: boolean;
}

function RoomPage() {
  let { roomId } = useParams();

  const [board, setBoard] = useState<{
    boards: BoardType;
    status: string;
  } | null>(null);
  const [availableBoards, setAvailableBoards] = useState<number | null>(null);
  const [player, setPlayer] = useState<{ id: string; marker: "X" | "O" }>({
    id: "",
    marker: "X",
  });
  const [nextPlayer, setNextPlayer] = useState<{
    id: string;
    marker: "X" | "O";
  } | null>(null);
  const [move, setMove] = useState<string>("");

  const [status, setStatus] = useState<{
    status: "connected" | "disconnected" | "connecting" | "auth";
    message: string;
  }>({ status: "connecting", message: "" });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleWebSocket = (password?: string) => {
    ws = new WebSocket(`/api/ws/${roomId}${password || ""}`);

    let playerId: string | null = null;

    // handle on connection established
    ws.onopen = () => {
      setStatus({ status: "connected", message: "" });
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      console.log(JSON.parse(event.data));
      const e: socketEvent = JSON.parse(event.data);
      const eventName = e.event;

      switch (eventName) {
        case "GameUpdate":
          setBoard(e.data.board);
          setAvailableBoards(e.data.next_board);
          setNextPlayer(e.data.next_player);
          break;
        case "PlayerUpdate":
          if (e.data.action === "PLAYER_JOINED" && !playerId) {
            playerId = e.data.player.id;

            setPlayer({ ...e.data.player });
          }
          break;

        case "Error":
          setStatus({
            status: "disconnected",
            message: e.data.error,
          });
          break;
      }
    };

    // handle on disconnection
    ws.onclose = () => {
      setStatus((state) => ({
        ...state,
        status: "disconnected",
        message:
          state.message === "ROOM_NOT_FOUND" ? state.message : "Cannot connect",
      }));
    };
  };

  const handlePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    fetch(`/api/room/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    })
      .then((response) => {
        console.log(response);
        if (response.ok) {
          handleWebSocket(password);
        }

        return response.json();
      })
      .then((data) => console.log(data));
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
                handleWebSocket();
              } else {
                setStatus({ status: "auth", message: "" });
              }
            });
          } else if (response.status === 404) {
            return setStatus({
              status: "disconnected",
              message: "Room Not Found",
            });
          }
        })
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false));
    };

    return checkRoom();
  }, [roomId]);

  // handle move
  useEffect(() => {
    if (!move || !status === ("connected" as any)) return;
    if (!availableBoards || availableBoards === parseInt(move.split(",")[0])) {
      ws.send(
        JSON.stringify({
          event: "GameUpdate",
          move,
          player_id: player.id,
        }),
      );
    }
  }, [move]);

  if (status.status === "connecting" || isLoading) {
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
      {status.status === "disconnected" ? (
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
      ) : status.status === "auth" ? (
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
        <div className="container mx-auto my-auto flex h-[calc(100vh-64px-48px-64px)] max-w-7xl flex-grow flex-col gap-4 px-6">
          <p className="w-full text-center font-semibold">
            {board.status
              ? `Player ${board.status} Won!`
              : `${nextPlayer?.marker}'s turn.`}
          </p>
          <Board
            board={board.boards}
            nextMove={
              nextPlayer?.id === player.id && board.status === null
                ? availableBoards
                : false
            }
            setMove={setMove}
          />
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
