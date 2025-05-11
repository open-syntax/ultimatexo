import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { button as buttonStyles } from "@heroui/theme";
import { Link } from "@heroui/link";

import Board from "@/components/board";
import DefaultLayout from "@/layouts/default";
import { BoardCell, Board as BoardType, socketEvent } from "@/types";


const b: { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" } = {
  cells: [null, null, null, null, null, null, null, null, null] as unknown as BoardCell[],
  status: "InProgress"
}

const boards: BoardType = [
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" },
  b as { cells: BoardCell[]; status: "InProgress" | "Draw" | "X" | "O" }
];

function RoomPage() {
  let { roomId } = useParams();

  const [board, setBoard] = useState<BoardType>(boards);
  const [player, setPlayer] = useState<{id: string; marker: "X" | "O"}>({ id: "", marker: "X" });

  const [status, setStatus] = useState<{
    status: "connected" | "disconnected" | "connecting";
    message: string;
  }>({ status: "connecting", message: "" });

  useEffect(() => {
    const ws = new WebSocket(
      `http://${import.meta.env.VITE_WS_URI}:${import.meta.env.VITE_WS_PORT}/ws/${roomId}`,
    );

    // handle on connection established
    ws.onopen = () => {
      setStatus({ status: "connected", message: "" });
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      console.log(JSON.parse(event.data))
      const e: socketEvent = JSON.parse(event.data);
      const eventName = e.event;


      switch (eventName) {
        case "GameUpdate":
          setBoard(e.data.board.boards);
          break;
        case "PlayerUpdate":
          if (e.data.action === "PLAYER_JOINED") {
            setPlayer(e.data.player);
          }
          break;
      }
    };

    // handle on disconnection
    ws.onclose = () => {
      setStatus({
        status: "disconnected",
        message: "Cannot connect",
      });
    };
  }, [roomId]);

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
        <div className="container mx-auto flex max-w-7xl flex-grow flex-col items-center justify-center gap-4 px-6">
          {status.message}
          <div className="flex gap-3">
            <Link className={buttonStyles({ variant: "bordered" })} href="/">
              Home
            </Link>
            <Link className={buttonStyles({ color: "primary" })} href="/rooms">
              Rooms
            </Link>
          </div>
        </div>
      ) : (
        <main className="container mx-auto flex max-w-7xl flex-grow items-center px-6">
          <Board board={board} />
        </main>
      )}
    </DefaultLayout>
  );
}

export default RoomPage;
