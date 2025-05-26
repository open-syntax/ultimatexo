import Cell from "./cell";

import { BoardCell, miniBoard } from "@/types/index";

interface MiniBoardProps {
  board: miniBoard;
  isNextBoard: boolean;
  index: number;

  setMove: Function;
}

function MiniBoard({ board, index, setMove, isNextBoard }: MiniBoardProps) {
  if (board.status === "O" || board.status === "X") {
    return (
      <div className="flex h-full w-full items-center justify-center border border-default-400">
        <div
          className={`relative h-full w-full animate-appearance-in before:absolute before:left-1/2 before:top-1/2 before:translate-x-[-50%] before:translate-y-[-50%] after:absolute after:left-1/2 after:top-1/2 after:translate-x-[-50%] after:translate-y-[-50%] after:bg-default-800 ${board.status === "X" ? "before:block before:h-6 before:w-[calc(100%-4px)] before:rotate-45 before:bg-default-800 after:block after:h-6 after:w-[calc(100%-4px)] after:-rotate-45" : "before:block before:h-[calc(100%-8px)] before:w-[calc(100%-8px)] before:rounded-full before:border-[24px] before:border-default-800"}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`grid aspect-square h-full w-full grid-cols-3 grid-rows-3 place-items-center border border-default-400 p-2 transition-shadow duration-500 ${isNextBoard ? "z-10 shadow-lg shadow-primary" : ""}`}
    >
      {board.cells.map((cell: BoardCell, i) => (
        <Cell key={i} board={index} index={i} mark={cell} onClick={setMove} />
      ))}
    </div>
  );
}

export default MiniBoard;
