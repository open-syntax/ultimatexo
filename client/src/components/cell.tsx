import { cn } from "@heroui/theme";

interface CellProps {
  mark?: string;
  index: number;

  onClick: () => void;
}

function Cell({ mark = "", index, onClick }: CellProps) {
  const handleClick = () => {
    if (mark === "") {
      onClick();
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

  if (mark === "X") {
    uxClasses = "text-red-500 pointer-events-none";
  } else if (mark === "O") {
    uxClasses = "text-blue-500 pointer-events-none";
  } else {
    uxClasses = "cursor-pointer";
  }

  return (
    <button className={cn(defaultClasses, borderClasses, uxClasses)} onClick={() => handleClick()}>
      {mark}
    </button>
  );
}

export default Cell;
