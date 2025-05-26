import MiniBoard from "./miniBoard";

import { Board as BoardType } from "@/types";

interface params {
  board: BoardType;
  nextMove: number | boolean | null;
  setMove: Function;
}

function Board({ board, setMove, nextMove }: params) {
  return (
    <div className="mx-auto grid aspect-square h-auto max-h-[calc(100svh-10rem)] w-full max-w-xl grid-cols-3 grid-rows-3 place-items-center">
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
          setMove={setMove}
        />
      ))}
    </div>
  );
}

export default Board;
