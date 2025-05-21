import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";

import { Link as LinkIcon } from "@/components/icons";
import Board from "@/components/board";
import DefaultLayout from "@/layouts/default";
import { Board as BoardType, socketEvent } from "@/types";
import RoomLayout from "@/layouts/room";

let ws: WebSocket;

function RoomPage() {
  let { roomId } = useParams();

  const [board, setBoard] = useState<BoardType | null>(null);
  const [availableBoards, setAvailableBoards] = useState<number | null>(null);
  const [player, setPlayer] = useState<{ id: string; marker: "X" | "O" }>({
    id: "",
    marker: "X",
  });
  const [nextPlayer, setNextPlayer] = useState<{ id: string; marker: "X" | "O" } | null>(null);
  const [move, setMove] = useState<string>("");

  const [status, setStatus] = useState<{
    status: "connected" | "disconnected" | "connecting";
    message: string;
  }>({ status: "connecting", message: "" });

  useEffect(() => {
    ws = new WebSocket(`/api/ws/${roomId}`);
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
          setBoard(e.data.board.boards);
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

  if (status.status === "connecting") {
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
      ) : board ? (
        <div className="container mx-auto my-auto flex max-w-7xl flex-grow gap-4 px-6">
          <Board board={board} nextMove={nextPlayer?.id === player.id ? (availableBoards) : false} setMove={setMove} />
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
