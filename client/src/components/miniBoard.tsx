import Cell from "./cell";

import { BoardCell, miniBoard } from "@/types/index";

interface MiniBoardProps {
  board: miniBoard;
  isNextBoard: boolean;
  index: number;

  setMove: Function;
}

function MiniBoard({ board, index, setMove, isNextBoard }: MiniBoardProps) {
  if (board.status) {
    return (
      <div className="flex h-full w-full items-center justify-center border border-default-400">
        <p className="animate-appearance-in text-9xl font-bold md:text-7xl">
          {board.status}
        </p>
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
