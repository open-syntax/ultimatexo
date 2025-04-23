import Cell from "./cell";

import { checkWinner } from "@/functions/game";
import { Board as BoardType } from "@/types/index";


interface MiniBoardProps {
  board: BoardType;

  index: number;
}

function MiniBoard({ board, index }: MiniBoardProps) {
//   const isWon = checkWinner(board);

//   if (isWon) {
//     return (
//       <div className="border border-default-400 w-full h-full flex items-center justify-center">
//         <p className="text-8xl font-bold" style={{ color: isWon === "X" ? "red" : "blue" }}>{isWon}</p>
//       </div>
//     );
//   }

  return (
    <div className="p-2 border border-default-400 grid grid-cols-3 grid-rows-3 w-full h-full place-items-center aspect-square">
      {board.map((mark, i) => (
        <Cell
          key={i}
          index={i}
          mark={mark}
          onClick={() => {
            console.log(i);
          }}
        />
      ))}
    </div>
  );
}

export default MiniBoard;
