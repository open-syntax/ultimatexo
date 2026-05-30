import { useState, useEffect, useCallback } from "react";

import { DemoBoardState } from "./shared";

import Board from "@/components/room/board";
import { Board as BoardType } from "@/types";

const DEMO_SEQUENCE: {
  board: DemoBoardState;
  arrowFrom: { board: number; cell: number };
  arrowTo: { board: number };
  message: string;
}[] = [
  {
    board: {
      boards: Array.from({ length: 9 }, (_, bi) => ({
        cells:
          bi === 4
            ? [null, null, null, null, "X", null, null, null, null]
            : Array(9).fill(null),
        status: "InProgress" as const,
      })),
      status: null,
      nextBoard: 4,
      lastMove: [4, 4] as [number, number],
      currentPlayer: "O",
    },
    arrowFrom: { board: 4, cell: 4 },
    arrowTo: { board: 4 },
    message: "X plays center → sends O to center board",
  },
  {
    board: {
      boards: Array.from({ length: 9 }, (_, bi) => ({
        cells:
          bi === 4
            ? [null, null, "O", null, "X", null, null, null, null]
            : Array(9).fill(null),
        status: "InProgress" as const,
      })),
      status: null,
      nextBoard: 2,
      lastMove: [4, 2] as [number, number],
      currentPlayer: "X",
    },
    arrowFrom: { board: 4, cell: 2 },
    arrowTo: { board: 2 },
    message: "O plays top-right → sends X to top-right board",
  },
  {
    board: {
      boards: Array.from({ length: 9 }, (_, bi) => {
        if (bi === 4)
          return {
            cells: [null, null, "O", null, "X", null, null, null, null],
            status: "InProgress" as const,
          };
        if (bi === 2)
          return {
            cells: [null, null, "X", null, null, null, null, null, null],
            status: "InProgress" as const,
          };

        return { cells: Array(9).fill(null), status: "InProgress" as const };
      }),
      status: null,
      nextBoard: 2,
      lastMove: [2, 2] as [number, number],
      currentPlayer: "O",
    },
    arrowFrom: { board: 2, cell: 2 },
    arrowTo: { board: 2 },
    message: "X plays top-right → sends O back to top-right board",
  },
  {
    board: {
      boards: Array.from({ length: 9 }, (_, bi) => {
        if (bi === 4)
          return {
            cells: [null, null, "O", null, "X", null, null, null, null],
            status: "InProgress" as const,
          };
        if (bi === 2)
          return {
            cells: [null, null, "X", null, null, null, null, null, "O"],
            status: "InProgress" as const,
          };

        return { cells: Array(9).fill(null), status: "InProgress" as const };
      }),
      status: null,
      nextBoard: 8,
      lastMove: [2, 8] as [number, number],
      currentPlayer: "X",
    },
    arrowFrom: { board: 2, cell: 8 },
    arrowTo: { board: 8 },
    message: "O plays bottom-right → sends X to bottom-right board",
  },
];

function convertToBoardType(demoState: DemoBoardState): {
  boards: BoardType;
  status: import("@/types").BoardStatus | null;
} {
  return {
    boards: demoState.boards as BoardType,
    status: demoState.status as import("@/types").BoardStatus | null,
  };
}

export function AutoPlayDemo() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const current = DEMO_SEQUENCE[step];

  useEffect(() => {
    if (isPaused) return;
    if (step >= DEMO_SEQUENCE.length - 1) return;

    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= DEMO_SEQUENCE.length - 1) {
          return prev;
        }

        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused, step]);

  const handleReset = useCallback(() => {
    setStep(0);
  }, []);

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {current.message}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? "Play" : "Pause"}
          </button>
          <button
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={handleReset}
          >
            Restart
          </button>
        </div>
      </div>

      <div className="relative flex justify-center">
        <div className="relative w-full max-w-md">
          <Board
            board={convertToBoardType(current.board)}
            className="pointer-events-none shadow-none max-w-none"
            lastMove={current.board.lastMove}
            nextBoard={current.board.nextBoard}
            nextPlayer={current.board.currentPlayer}
          />
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-1.5 mt-4">
        {DEMO_SEQUENCE.map((_, i) => (
          <button
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "w-6 bg-blue-500"
                : "w-2 bg-gray-300 dark:bg-gray-600"
            }`}
            onClick={() => setStep(i)}
          />
        ))}
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Step {step + 1} of {DEMO_SEQUENCE.length} — The cell you pick is a
          compass pointing to the next board
        </p>
      </div>
    </div>
  );
}
