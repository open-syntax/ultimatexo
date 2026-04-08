import { cn } from "@heroui/theme";
import { motion, useReducedMotion } from "framer-motion";

import { O, X } from "../icons";

import Cell from "./cell";

import { GameStore, PlayerStore } from "@/store";
import { BoardStatus, miniBoard } from "@/types";

interface MiniBoardProps {
  board: miniBoard;
  index: number;
  status: BoardStatus | null;
}

const MINI_BOARD_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function MiniBoard({ board, status, index }: MiniBoardProps) {
  const {
    move: { nextMove },
    nextPlayer,
  } = GameStore();
  const { player } = PlayerStore();
  const prefersReducedMotion = useReducedMotion();

  const isAvailable = status === null && [index, null].includes(nextMove);
  const highlightClass =
    nextPlayer === "O"
      ? "border-danger/70 bg-danger/10 shadow-[0_0_20px_2px_rgba(239,68,68,0.22)]"
      : "border-primary/70 bg-primary/10 shadow-[0_0_20px_2px_rgba(37,99,235,0.22)]";
  const pulseShadow =
    nextPlayer === "O"
      ? [
          "0 0 0px rgba(239,68,68,0)",
          "0 0 18px rgba(239,68,68,0.28)",
          "0 0 0px rgba(239,68,68,0)",
        ]
      : [
          "0 0 0px rgba(37,99,235,0)",
          "0 0 18px rgba(37,99,235,0.28)",
          "0 0 0px rgba(37,99,235,0)",
        ];

  if (board.status === "O" || board.status === "X") {
    return (
      <div className="border-foreground-100/70 bg-content2/70 flex h-full w-full items-center justify-center rounded-2xl border">
        <div
          className={`flex h-full w-full items-center justify-center rounded-2xl text-8xl font-bold ${board.status === "X" ? "text-primary bg-primary/10" : "text-danger bg-danger/10"}`}
        >
          {board.status === "X" ? (
            <X className="scale-[4]" />
          ) : (
            <O className="scale-[4]" />
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      animate={
        !prefersReducedMotion && isAvailable && player?.marker === nextPlayer
          ? {
              boxShadow: pulseShadow,
            }
          : undefined
      }
      className={cn(
        "grid aspect-square h-full w-full grid-cols-3 grid-rows-3 place-items-center gap-2 rounded-2xl border p-2 transition-all duration-300 max-sm:gap-1 max-sm:p-1",
        isAvailable && player?.marker === nextPlayer
          ? highlightClass
          : "border-foreground-100/70 bg-content2/70",
      )}
      transition={{ duration: 1.7, ease: "easeInOut", repeat: Infinity }}
    >
      {MINI_BOARD_POSITIONS.map((position) => (
        <Cell
          key={position}
          board={index}
          boardStatus={status}
          index={position}
          mark={board.cells[position]}
        />
      ))}
    </motion.div>
  );
}

export default MiniBoard;
