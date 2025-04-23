import MiniBoard from "./miniBoard";

import { Board as BoardType } from "@/types";

interface BoardProps {
  board: [
    BoardType,
    BoardType,
    BoardType,
    BoardType,
    BoardType,
    BoardType,
    BoardType,
    BoardType,
    BoardType
];
}

function Board({ board }: BoardProps) {
  return (
    <div className="w-screen h-full grid grid-cols-3 grid-rows-3 place-items-center max-h-[calc(100vh-10rem)] max-w-xl mx-auto">
      {board.map((row, i) => (
        <MiniBoard key={i} board={row} index={i} />
      ))}
    </div>
  );
}

export default Board;
