import { cn } from "@heroui/theme";

import { BoardCell } from "@/types";

interface CellProps {
  mark: BoardCell;
  board: number;
  index: number;

  onClick: Function;
}

function Cell({ mark, board, index, onClick }: CellProps) {
  const handleClick = () => {
    if (mark === null) {
      onClick(`${board},${index}`);
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

  if (mark === "X"  as unknown as BoardCell || mark === "O" as unknown as BoardCell) {
    uxClasses = "text-default-800 pointer-events-none";
  } else {
    uxClasses = "cursor-pointer";
  }

  return (
    <button className={cn(defaultClasses, borderClasses, uxClasses, "animate-appearance-in")} onClick={() => handleClick()}>
      {mark && <p className="font-bold animate-appearance-in">{mark as unknown as string}</p>}
    </button>
  );
}

export default Cell;
