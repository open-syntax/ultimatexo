import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@heroui/theme";

import { O, X } from "../icons";

import { Ripple } from "./ripple";

import { boardCell, BoardStatus } from "@/types";
import { GameStore, PlayerStore, RoomStore } from "@/store";
import { Marker } from "@/types/player";

interface CellProps {
  mark: boardCell;
  board: number;
  index: number;
  boardStatus: BoardStatus | null;
  lastMove?: [number, number] | null;
  nextPlayer?: "X" | "O";
}

function Cell({
  boardStatus,
  mark,
  board,
  index,
  lastMove: lastMoveProp,
  nextPlayer: nextPlayerProp,
}: CellProps) {
  const { player } = PlayerStore();
  const { playMove, move, nextPlayer } = GameStore();
  const { ws } = RoomStore();

  const lastMove = lastMoveProp ?? move.lastMove;
  const resolvedNextPlayer = nextPlayerProp ?? nextPlayer;

  const isAvailable =
    boardStatus === null &&
    [board, null].includes(move.nextMove) &&
    mark === null &&
    nextPlayer === player?.marker;

  const handleClick = () => {
    if (!isAvailable) return;
    playMove([board, index], ws);
  };

  // Track mark changes for animation and ripple
  const prevMarkRef = useRef<Marker>(mark);
  const hasAnimated = useRef(mark !== null);
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (prevMarkRef.current !== null && mark === null) {
      hasAnimated.current = false;
    }
    if (prevMarkRef.current === null && mark !== null) {
      setShowRipple(true);
      timer = setTimeout(() => setShowRipple(false), 700);
    }
    prevMarkRef.current = mark;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [mark]);

  // Aria label describing the cell state
  const ariaLabel = (() => {
    const b = board + 1;
    const c = index + 1;

    if (mark === "X") {
      const isLast =
        Array.isArray(lastMove) &&
        lastMove[0] === board &&
        lastMove[1] === index;

      return isLast
        ? `Board ${b}, cell ${c}. X. Last move.`
        : `Board ${b}, cell ${c}. X.`;
    }
    if (mark === "O") {
      const isLast =
        Array.isArray(lastMove) &&
        lastMove[0] === board &&
        lastMove[1] === index;

      return isLast
        ? `Board ${b}, cell ${c}. O. Last move.`
        : `Board ${b}, cell ${c}. O.`;
    }
    if (isAvailable) {
      return `Board ${b}, cell ${c}. Empty. Press Enter to play ${resolvedNextPlayer}.`;
    }

    return `Board ${b}, cell ${c}. Empty.`;
  })();

  // Focus ring color matches the current player's turn
  const focusRingClass =
    resolvedNextPlayer === "O"
      ? "focus-visible:outline-danger"
      : "focus-visible:outline-primary";

  let defaultClasses =
    "w-full h-full flex items-center justify-center rounded-lg border border-foreground-100/70 bg-content1/70 text-3xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2";
  let uxClasses = "";

  if (mark === "X" || mark === "O") {
    uxClasses = "text-default-800 pointer-events-none";
  }

  if (isAvailable) {
    uxClasses = "cursor-pointer";
  }

  if (
    Array.isArray(lastMove) &&
    lastMove[0] === board &&
    lastMove[1] === index
  ) {
    defaultClasses =
      resolvedNextPlayer === "X"
        ? `${defaultClasses} bg-danger/10 shadow-inner shadow-danger/50`
        : `${defaultClasses} bg-primary/10 shadow-inner shadow-primary/50`;
  }

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        defaultClasses,
        focusRingClass,
        "animate-appearance-in relative overflow-hidden",
      )}
      data-board={board}
      data-cell={index}
      tabIndex={isAvailable ? 0 : -1}
      type="button"
      onClick={handleClick}
    >
      {showRipple && <Ripple color={mark === "X" ? "primary" : "danger"} />}
      {mark ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className={`flex h-full w-full items-center justify-center rounded-xl text-8xl font-bold ${mark === "X" ? "text-primary" : "text-danger"}`}
          initial={hasAnimated.current ? false : { opacity: 0, scale: 0.2 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
          onAnimationComplete={() => {
            hasAnimated.current = true;
          }}
        >
          {mark === "X" ? (
            <X className="scale-[1.5] max-sm:scale-110" strokeWidth={3} />
          ) : (
            <O className="scale-[1.5] max-sm:scale-110" strokeWidth={3} />
          )}
        </motion.div>
      ) : (
        // eslint-disable-next-line react/self-closing-comp
        <div className={cn("h-full w-full", uxClasses)}></div>
      )}
    </button>
  );
}

export default Cell;
