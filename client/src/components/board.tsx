import MiniBoard from "./miniBoard";

import { Board as BoardType } from "@/types";

function Board({ board }: { board: BoardType}) {
  return (
    <div className="w-screen h-full grid grid-cols-3 grid-rows-3 place-items-center max-h-[calc(100vh-10rem)] max-w-xl mx-auto">
      {board.map((miniBoard, i) => (
        <MiniBoard key={i} board={miniBoard} index={i} />
      ))}
    </div>
  );
}

export default Board;
