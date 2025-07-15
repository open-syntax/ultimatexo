import MiniBoard from "./miniBoard";

import { Board as BoardType } from "@/types";

interface params {
  board: BoardType;
  nextMove: number | boolean | null;
}

function Board({ board, nextMove }: params) {
  return (
    <div id="board" className="mx-auto grid aspect-square h-auto max-h-[calc(100svh-10rem)] w-full max-w-xl grid-cols-3 grid-rows-3 place-items-center">
      {board.map((miniBoard, i) => (
        <MiniBoard
          key={i}
          board={miniBoard}
          index={i}
          isNextBoard={
            (typeof nextMove === "boolean" && nextMove) ||
            (typeof nextMove === "number" && i === nextMove) ||
            nextMove === null
          }
        />
      ))}
    </div>
  );
}

export default Board;
