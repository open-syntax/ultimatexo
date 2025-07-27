import { cn } from "@heroui/theme";

import { boardCell } from "@/types";
import { GameStore, PlayerStore } from "@/store";

interface CellProps {
  mark: boardCell;
  board: number;
  index: number;
}

function Cell({ mark, board, index }: CellProps) {
  const {
    player: {
      info: { marker },
    },
  } = PlayerStore();
  const { playMove, move, nextPlayer } = GameStore();

  const isAvailable =
    [board, null].includes(move.nextMove) &&
    mark === null &&
    nextPlayer === marker;

  const handleClick = () => {
    if (!isAvailable) return;
    playMove([board, index]);
  };

  let defaultClasses =
    "w-full h-full flex items-center justify-center border-default-400 text-3xl";
  let borderClasses = "";
  let uxClasses = "";

  switch (index) {
    case 0:
      borderClasses = "border-r-2 border-b-2";
      break;
    case 1:
      borderClasses = "border-b-2";
      break;
    case 2:
      borderClasses = "border-l-2 border-b-2";
      break;
    case 3:
      borderClasses = "border-r-2";
      break;
    case 4:
      borderClasses = "";
      break;
    case 5:
      borderClasses = "border-l-2";
      break;
    case 6:
      borderClasses = "border-r-2 border-t-2";
      break;
    case 7:
      borderClasses = "border-t-2";
      break;
    case 8:
      borderClasses = "border-l-2 border-t-2";
  }

  if (
    mark === ("X" as unknown as boardCell) ||
    mark === ("O" as unknown as boardCell)
  ) {
    uxClasses = "text-default-800 pointer-events-none";
  }

  if (isAvailable) {
    // uxClasses = "cursor-pointer outline outline-2 outline-primary rounded-sm";
    uxClasses =
      "cursor-pointer bg-primary/20 outline outline-1 outline-primary rounded-sm";
    defaultClasses = defaultClasses + " cursor-pointer p-1.5";
  }

  if (
    Array.isArray(move.lastMove) &&
    move.lastMove[0] === board &&
    move.lastMove[1] === index
  ) {
    if (mark === "X" as unknown as boardCell) {
      defaultClasses = defaultClasses + " *:before:bg-warning-400 *:after:bg-warning-400";
    } else {
      defaultClasses = defaultClasses + " *:before:border-warning-400";
    }
  }

  return (
    <button
      className={cn(
        defaultClasses,
        borderClasses,
        "relative animate-appearance-in",
      )}
      onClick={() => handleClick()}
    >
      {mark ? (
        <div
          className={`relative aspect-square h-full animate-appearance-in before:absolute before:left-1/2 before:top-1/2 before:translate-x-[-50%] before:translate-y-[-50%] after:absolute after:left-1/2 after:top-1/2 after:translate-x-[-50%] after:translate-y-[-50%] after:bg-default-800 ${mark === ("X" as unknown as boardCell) ? "before:block before:h-2 before:w-[calc(100%-4px)] before:rotate-45 before:bg-default-800 after:block after:h-2 after:w-[calc(100%-4px)] after:-rotate-45" : "before:block before:h-[calc(100%-8px)] before:w-[calc(100%-8px)] before:rounded-full before:border-8 before:border-default-800"}`}
        />
      ) : (
        // eslint-disable-next-line react/self-closing-comp
        <div className={cn(uxClasses, "h-full w-full")}></div>
      )}
    </button>
  );
}

export default Cell;
