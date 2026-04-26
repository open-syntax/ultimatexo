import { cn } from "@heroui/theme";

import { O, X } from "../icons";

import Cell from "./cell";

import { GameStore, PlayerStore } from "@/store";
import { BoardStatus, miniBoard } from "@/types";

interface MiniBoardProps {
  board: miniBoard;
  index: number;
  status: BoardStatus | null;
  nextBoard?: number | null;
  lastMove?: [number, number] | null;
  nextPlayer?: "X" | "O";
}

const MINI_BOARD_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function MiniBoard({
  board,
  status,
  index,
  nextBoard: nextBoardProp,
  lastMove,
  nextPlayer: nextPlayerProp,
}: MiniBoardProps) {
  const {
    move: { nextMove },
    nextPlayer,
  } = GameStore();
  const { player } = PlayerStore();

  const nextBoard = nextBoardProp ?? nextMove;
  const resolvedNextPlayer = nextPlayerProp ?? nextPlayer;

  const isAvailable = status === null && [index, null].includes(nextBoard);
  const isActiveTurnBoard =
    nextBoardProp !== undefined
      ? isAvailable
      : isAvailable && player?.marker === nextPlayer;
  const nextPlayerShadowClass =
    resolvedNextPlayer === "O"
      ? "shadow-[0_0_30px_rgba(239,68,68,0.45)]"
      : "shadow-[0_0_30px_rgba(37,99,235,0.45)]";

  if (board.status === "O" || board.status === "X") {
    return (
      <div className="border-foreground-100/70 bg-content2/70 flex h-full w-full items-center justify-center rounded-2xl border">
        <div
          className={`flex h-full w-full items-center justify-center rounded-2xl text-8xl font-bold ${board.status === "X" ? "text-primary bg-primary/10" : "text-danger bg-danger/10"}`}
        >
          {board.status === "X" ? (
            <X className="scale-[4] max-sm:scale-[2.5]" />
          ) : (
            <O className="scale-[4] max-sm:scale-[2.5]" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-foreground-100/70 bg-content2/70 grid aspect-square h-full w-full grid-cols-3 grid-rows-3 place-items-center gap-2 rounded-2xl border p-2 transition-all duration-300 max-sm:gap-1 max-sm:p-1",
        isActiveTurnBoard ? nextPlayerShadowClass : "",
      )}
    >
      {MINI_BOARD_POSITIONS.map((position) => (
        <Cell
          key={position}
          board={index}
          boardStatus={status}
          index={position}
          lastMove={lastMove}
          nextPlayer={resolvedNextPlayer ?? undefined}
          mark={board.cells[position]}
        />
      ))}
    </div>
  );
}

export default MiniBoard;
