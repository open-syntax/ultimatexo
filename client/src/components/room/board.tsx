import { useEffect, useRef, useState } from "react";
import { cn } from "@heroui/theme";

import MiniBoard from "./miniBoard";
import { ConfettiBurst } from "./confetti";

import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { GameStore, PlayerStore, SettingsStore } from "@/store";
import { BoardStatus, Board as BoardType } from "@/types";

interface params {
  board: {
    boards: BoardType;
    status: BoardStatus | null;
  };
  className?: string;
  nextBoard?: number | null;
  lastMove?: [number, number] | null;
  nextPlayer?: "X" | "O";
}

const BOARD_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

function Board({
  board,
  className,
  nextBoard: nextBoardProp,
  lastMove: lastMoveProp,
  nextPlayer: nextPlayerProp,
}: params) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<BoardStatus | null>(null);
  const confettiFiredRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { move, nextPlayer: nextPlayerStore } = GameStore();
  const { player } = PlayerStore();
  const { focusMode } = SettingsStore();

  const nextBoard = nextBoardProp ?? move.nextMove;
  const lastMove = lastMoveProp ?? move.lastMove;
  const nextPlayer = nextPlayerProp ?? nextPlayerStore;

  const { autoFocusFirstPlayable } = useKeyboardNavigation(containerRef);

  // Trigger confetti and screen shake on game end
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = board.status;

    if (prev === null && curr !== null) {
      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        setShowConfetti(true);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
        }, 200);
      }
    }

    if (curr === null) {
      confettiFiredRef.current = false;
      setShowConfetti(false);
    }

    prevStatusRef.current = curr;
  }, [board.status]);

  // Auto-focus first playable cell on mount
  useEffect(() => {
    autoFocusFirstPlayable();
  }, [autoFocusFirstPlayable]);

  // Auto-focus after a move if a cell inside the board already has focus
  useEffect(() => {
    const active = document.activeElement;

    if (active && containerRef.current?.contains(active)) {
      const timer = setTimeout(() => {
        autoFocusFirstPlayable();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [lastMove, autoFocusFirstPlayable]);

  // Focus mode: only when it's our turn and game is active
  const isMyTurn = nextPlayer === player?.marker;
  const isGameActive = board.status === null;
  const isFocusModeActive = focusMode && isGameActive && isMyTurn;

  return (
    <>
      {showConfetti &&
        board.status &&
        board.status !== "Paused" &&
        board.status !== "WaitingForPlayers" && (
          <ConfettiBurst
            type={
              board.status === BoardStatus.Draw
                ? "Draw"
                : board.status === BoardStatus.X
                  ? "X"
                  : "O"
            }
          />
        )}
      <div
        ref={containerRef}
        className={cn(
          "border-foreground-100/70 bg-content1/90 grid aspect-square h-auto max-h-[calc(100svh-10rem)] w-full max-w-2xl grid-cols-3 grid-rows-3 place-items-center gap-2.5 rounded-3xl border p-3.5 shadow-[0_18px_70px_rgba(15,23,42,0.4)] max-sm:max-h-[calc(100svh-8rem)] max-sm:gap-1.5 max-sm:p-2 md:gap-3 md:p-4",
          isShaking && "animate-board-shake",
          className,
        )}
        id="board"
      >
        {BOARD_POSITIONS.map((position) => {
          const isFocused = isFocusModeActive
            ? nextBoard === null
              ? board.boards[position].status === "InProgress"
              : position === nextBoard
            : undefined;

          return (
            <MiniBoard
              key={position}
              board={board.boards[position]}
              index={position}
              isFocused={isFocused}
              lastMove={lastMove}
              nextBoard={nextBoard}
              nextPlayer={nextPlayer ?? undefined}
              status={board.status}
            />
          );
        })}
      </div>
    </>
  );
}

export default Board;
