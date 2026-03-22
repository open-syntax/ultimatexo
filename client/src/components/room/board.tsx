import { cn } from "@heroui/theme";

import MiniBoard from "./miniBoard";

import { BoardStatus, Board as BoardType } from "@/types";

interface params {
  board: {
    boards: BoardType;
    status: BoardStatus | null;
  };
  className?: string;
}

const BOARD_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function Board({ board, className }: params) {
  return (
    <div
      className={cn(
        "grid aspect-square h-auto max-h-[calc(100svh-10rem)] w-full max-w-xl grid-cols-3 grid-rows-3 place-items-center gap-3",
        className,
      )}
      id="board"
    >
      {BOARD_POSITIONS.map((position) => (
        <MiniBoard
          key={position}
          board={board.boards[position]}
          index={position}
          status={board.status}
        />
      ))}
    </div>
  );
}

export default Board;
