import { cn } from "@heroui/theme";

import MiniBoard from "./miniBoard";

import { BoardStatus, Board as BoardType } from "@/types";

interface params {
  board: {
    boards: BoardType;
    status: BoardStatus | null;
  };
  className?: string;
  nextBoard?: number | null;
  lastMove?: [number, number] | null;
  nextPlayer?: "X" | "O";
}

const BOARD_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function Board({ board, className, nextBoard, lastMove, nextPlayer }: params) {
  return (
    <div
      className={cn(
        "border-foreground-100/70 bg-content1/90 grid aspect-square h-auto max-h-[calc(100svh-10rem)] w-full max-w-2xl grid-cols-3 grid-rows-3 place-items-center gap-2.5 rounded-3xl border p-3.5 shadow-[0_18px_70px_rgba(15,23,42,0.4)] max-sm:max-h-[calc(100svh-8rem)] max-sm:gap-1.5 max-sm:p-2 md:gap-3 md:p-4",
        className,
      )}
      id="board"
    >
      {BOARD_POSITIONS.map((position) => (
        <MiniBoard
          key={position}
          board={board.boards[position]}
          index={position}
          lastMove={lastMove}
          nextBoard={nextBoard}
          nextPlayer={nextPlayer}
          status={board.status}
        />
      ))}
    </div>
  );
}

export default Board;
