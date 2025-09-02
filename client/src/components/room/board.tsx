import MiniBoard from "./miniBoard";

import { Board as BoardType } from "@/types";

interface params {
  board: BoardType;
}

function Board({ board }: params) {
  return (
    <div
      className="mx-auto grid aspect-square gap-3 h-auto max-h-[calc(100svh-10rem)] w-full max-w-xl grid-cols-3 grid-rows-3 place-items-center"
      id="board"
    >
      {board.map((miniBoard, i) => (
        <MiniBoard key={i} board={miniBoard} index={i} />
      ))}
    </div>
  );
}

export default Board;
