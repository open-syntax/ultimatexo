import MiniBoard from "./miniBoard";

import { BoardStatus, Board as BoardType } from "@/types";

interface params {
  board: {
    boards: BoardType;
    status: BoardStatus;
  };
}

function Board({ board }: params) {
  return (
    <div
      className="mx-auto grid aspect-square h-auto max-h-[calc(100svh-10rem)] w-full max-w-xl grid-cols-3 grid-rows-3 place-items-center gap-3"
      id="board"
    >
      {board.boards.map((miniBoard, i) => (
        <MiniBoard key={i} board={miniBoard} index={i} status={board.status} />
      ))}
    </div>
  );
}

export default Board;
