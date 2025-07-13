import { cn } from "@heroui/theme";

import { boardCell } from "@/types";
import PlayerStore from "@/store/player";

interface CellProps {
  mark: boardCell;
  board: number;
  index: number;
}

function Cell({ mark, board, index }: CellProps) {
  const {
    playMove,
    availableBoards,
    nextPlayer,
    player: {
      info: { marker },
    },
  } = PlayerStore();

  const handleClick = () => {
    if (
      mark === null &&
      [board, null].includes(availableBoards) &&
      nextPlayer === marker
    ) {
      playMove(`${board},${index}`);
    }
  };

  const defaultClasses =
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
  } else {
    uxClasses = "cursor-pointer";
  }

  return (
    <button
      className={cn(
        defaultClasses,
        borderClasses,
        uxClasses,
        "relative animate-appearance-in",
      )}
      onClick={() => handleClick()}
    >
      {mark && (
        <div
          className={`relative aspect-square h-full animate-appearance-in before:absolute before:left-1/2 before:top-1/2 before:translate-x-[-50%] before:translate-y-[-50%] after:absolute after:left-1/2 after:top-1/2 after:translate-x-[-50%] after:translate-y-[-50%] after:bg-default-800 ${mark === ("X" as unknown as boardCell) ? "before:block before:h-2 before:w-[calc(100%-4px)] before:rotate-45 before:bg-default-800 after:block after:h-2 after:w-[calc(100%-4px)] after:-rotate-45" : "before:block before:h-[calc(100%-8px)] before:w-[calc(100%-8px)] before:rounded-full before:border-8 before:border-default-800"}`}
        />
      )}
    </button>
  );
}

export default Cell;
