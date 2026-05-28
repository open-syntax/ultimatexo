import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
  isFocused?: boolean;
}

const MINI_BOARD_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function MiniBoard({
  board,
  status,
  index,
  nextBoard: nextBoardProp,
  lastMove,
  nextPlayer: nextPlayerProp,
  isFocused,
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

  const prevStatusRef = useRef(board.status);
  const [isJustWon, setIsJustWon] = useState(false);

  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = board.status;

    if (prev !== "X" && prev !== "O" && (curr === "X" || curr === "O")) {
      setIsJustWon(true);
      const timer = setTimeout(() => setIsJustWon(false), 600);

      return () => clearTimeout(timer);
    }
    prevStatusRef.current = curr;
  }, [board.status]);

  // Breathing glow animation class
  const breatheClass =
    isActiveTurnBoard && resolvedNextPlayer === "O"
      ? "animate-breathe-red"
      : isActiveTurnBoard && resolvedNextPlayer === "X"
        ? "animate-breathe-blue"
        : "";

  // Focus mode classes
  const focusClasses =
    isFocused === true
      ? "scale-[1.04] z-10 opacity-100"
      : isFocused === false
        ? "scale-[0.96] opacity-40 blur-[1px]"
        : "";

  if (board.status === "O" || board.status === "X") {
    const isX = board.status === "X";

    return (
      <motion.div
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "border-foreground-100/70 flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border",
          isX ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger",
          isJustWon &&
            (isX ? "animate-win-pulse-blue" : "animate-win-pulse-red"),
        )}
        initial={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-2xl text-8xl font-bold">
          {isX ? (
            <X className="scale-[4] max-sm:scale-[2.5]" />
          ) : (
            <O className="scale-[4] max-sm:scale-[2.5]" />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "border-foreground-100/70 bg-content2/70 grid aspect-square h-full w-full grid-cols-3 grid-rows-3 place-items-center gap-2 rounded-2xl border p-2 transition-all duration-400 ease-out max-sm:gap-1 max-sm:p-1",
        breatheClass,
        focusClasses,
      )}
    >
      {MINI_BOARD_POSITIONS.map((position) => (
        <Cell
          key={position}
          board={index}
          boardStatus={status}
          index={position}
          lastMove={lastMove}
          mark={board.cells[position]}
          nextPlayer={resolvedNextPlayer ?? undefined}
        />
      ))}
    </div>
  );
}

export default MiniBoard;
