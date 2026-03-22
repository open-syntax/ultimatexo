import { cn } from "@heroui/theme";

import { O, X } from "../icons";

import { boardCell, BoardStatus } from "@/types";
import { GameStore, PlayerStore } from "@/store";

interface CellProps {
  mark: boardCell;
  board: number;
  index: number;
  boardStatus: BoardStatus | null;
}

function Cell({ boardStatus, mark, board, index }: CellProps) {
  const { player } = PlayerStore();
  const { playMove, move, nextPlayer } = GameStore();

  const isAvailable =
    boardStatus === null &&
    [board, null].includes(move.nextMove) &&
    mark === null &&
    nextPlayer === player?.marker;

  const handleClick = () => {
    if (!isAvailable) return;
    playMove([board, index]);
  };

  let defaultClasses =
    "w-full h-full flex items-center justify-center rounded-lg border border-foreground-100/70 bg-content1/70 text-3xl transition-all duration-200";
  let uxClasses = "";

  if (
    mark === ("X" as unknown as boardCell) ||
    mark === ("O" as unknown as boardCell)
  ) {
    uxClasses = "text-default-800 pointer-events-none";
  }

  if (isAvailable) {
    // uxClasses = "cursor-pointer outline outline-2 outline-primary rounded-sm";
    uxClasses = "cursor-pointer";
  }

  if (
    Array.isArray(move.lastMove) &&
    move.lastMove[0] === board &&
    move.lastMove[1] === index
  ) {
    defaultClasses =
      nextPlayer === "X"
        ? `${defaultClasses} bg-danger/10 shadow-inner shadow-danger/50`
        : `${defaultClasses} bg-primary/10 shadow-inner shadow-primary/50`;
  }

  return (
    <button
      className={cn(defaultClasses, "animate-appearance-in relative")}
      type="button"
      onClick={() => handleClick()}
    >
      {mark ? (
        <div
          className={`flex h-full w-full items-center justify-center rounded-xl text-8xl font-bold ${mark === ("X" as unknown as boardCell) ? "text-primary" : "text-danger"}`}
        >
          {mark === ("X" as unknown as boardCell) ? (
            <X className="scale-[1.5] max-sm:scale-110" strokeWidth={3} />
          ) : (
            <O className="scale-[1.5] max-sm:scale-110" strokeWidth={3} />
          )}
        </div>
      ) : (
        // eslint-disable-next-line react/self-closing-comp
        <div className={cn("h-full w-full", uxClasses)}></div>
      )}
    </button>
  );
}

export default Cell;
