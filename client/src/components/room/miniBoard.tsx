import { cn } from "@heroui/theme";

import { O, X } from "../icons";

import Cell from "./cell";

import { GameStore, PlayerStore } from "@/store";
import { boardCell, BoardStatus, miniBoard } from "@/types/index";

interface MiniBoardProps {
  board: miniBoard;
  index: number;
  status: BoardStatus | null;
}

function MiniBoard({ board, status, index }: MiniBoardProps) {
  const {
    move: { nextMove },
    nextPlayer,
  } = GameStore();
  const { player } = PlayerStore();

  const isAvailable = status === null && [index, null].includes(nextMove);

  if (board.status === "O" || board.status === "X") {
    return (
      <div className="bg-primary-100 flex h-full w-full items-center justify-center rounded-xl">
        <div
          className={`text-primary flex h-full w-full items-center justify-center rounded-xl text-8xl font-bold ${board.status === "X" ? "text-primary" : "text-primary-600"}`}
        >
          {board.status === "X" ? (
            <X className="scale-[4]" />
          ) : (
            <O className="scale-[4]" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        `bg-primary grid aspect-square h-full w-full grid-cols-3 grid-rows-3 place-items-center gap-2 rounded-xl p-2 transition-shadow duration-500 max-sm:gap-1 max-sm:p-1`,
        isAvailable && player?.marker === nextPlayer
          ? "bg-primary shadow-primary shadow-[0_0_8px_1px]"
          : "bg-primary-100",
      )}
    >
      {board.cells.map((cell: boardCell, i) => (
        <Cell
          key={i}
          board={index}
          boardStatus={status}
          index={i}
          mark={cell}
        />
      ))}
    </div>
  );
}

export default MiniBoard;
