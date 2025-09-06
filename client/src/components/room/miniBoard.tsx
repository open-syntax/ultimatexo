import { cn } from "@heroui/theme";

import { O, X } from "../icons";

import Cell from "./cell";

import { GameStore, PlayerStore } from "@/store";
import { boardCell, miniBoard } from "@/types/index";

interface MiniBoardProps {
  board: miniBoard;
  index: number;
}

function MiniBoard({ board, index }: MiniBoardProps) {
  const {
    move: { nextMove },
    nextPlayer,
  } = GameStore();
  const {
    player
  } = PlayerStore();

  const isAvailable = [index, null].includes(nextMove);

  if (board.status === "O" || board.status === "X") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary-100">
        <div
          className={`flex h-full w-full items-center justify-center rounded-xl text-8xl font-bold text-primary ${board.status === "X" ? "text-primary" : "text-primary-600"}`}
        >
          {board.status === "X" ? <X className="scale-[4]" /> : <O className="scale-[4]" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        `grid aspect-square h-full w-full grid-cols-3 grid-rows-3 place-items-center gap-2 rounded-xl bg-primary p-2 transition-shadow duration-500`,
        isAvailable && player === nextPlayer
          ? "bg-primary shadow-[0_0_8px_1px] shadow-primary"
          : "bg-primary-100",
      )}
    >
      {board.cells.map((cell: boardCell, i) => (
        <Cell key={i} board={index} index={i} mark={cell} />
      ))}
    </div>
  );
}

export default MiniBoard;
