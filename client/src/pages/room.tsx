import { useParams } from "react-router-dom";

import Board from "@/components/board";
import DefaultLayout from "@/layouts/default";
import { Board as BoardType } from "@/types";

type BoardT = [
  BoardType,
  BoardType,
  BoardType,
  BoardType,
  BoardType,
  BoardType,
  BoardType,
  BoardType,
  BoardType,
];

const board: BoardT = [
  ["", "", "", "O", "", "", "", "", ""],
  ["", "", "", "", "", "X", "", "", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["O", "", "", "O", "", "", "O", "", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "X", "", ""],
  ["", "", "", "", "", "", "", "", "O"],
  ["", "", "", "", "", "", "X", "X", "X"],
];

function RoomPage() {
  let { roomId } = useParams();

  return (
    <DefaultLayout>
      <main className="container mx-auto max-w-7xl px-6 flex-grow flex items-center">
        <Board board={board} />
      </main>
    </DefaultLayout>
  );
}

export default RoomPage;
