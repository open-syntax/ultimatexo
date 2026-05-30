import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  DemoBoardState,
  createEmptyBoard,
  checkMiniWinner,
  getBoardPositionName,
  FloatingTooltip,
} from "./shared";

import Board from "@/components/room/board";
import { Board as BoardType } from "@/types";

function makeMove(
  state: DemoBoardState,
  boardIndex: number,
  cellIndex: number,
): DemoBoardState {
  const newBoards = state.boards.map((b, i) => {
    if (i !== boardIndex) return b;
    const newCells = [...b.cells];

    newCells[cellIndex] = state.currentPlayer;
    const winner = checkMiniWinner(newCells);

    return {
      cells: newCells,
      status: winner ?? ("InProgress" as const),
    };
  });

  return {
    boards: newBoards,
    status: null,
    nextBoard: cellIndex,
    lastMove: [boardIndex, cellIndex],
    currentPlayer: state.currentPlayer === "X" ? "O" : "X",
  };
}

function isValidMove(
  state: DemoBoardState,
  boardIndex: number,
  cellIndex: number,
): boolean {
  const { nextBoard, boards, currentPlayer } = state;

  if (currentPlayer !== "X") return false;

  const board = boards[boardIndex];

  if (board.status !== "InProgress") return false;
  if (board.cells[cellIndex] !== null) return false;

  if (nextBoard !== null && nextBoard !== boardIndex) {
    const targetBoard = boards[nextBoard];

    if (
      targetBoard.status === "InProgress" &&
      targetBoard.cells.some((c) => c === null)
    ) {
      return false;
    }
  }

  return true;
}

function convertToBoardType(demoState: DemoBoardState): {
  boards: BoardType;
  status: import("@/types").BoardStatus | null;
} {
  return {
    boards: demoState.boards as BoardType,
    status: demoState.status as import("@/types").BoardStatus | null,
  };
}

export function BackAndForthDemo() {
  const [board, setBoard] = useState<DemoBoardState>(createEmptyBoard());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [shakeBoard, setShakeBoard] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCellClick = useCallback(
    (boardIndex: number, cellIndex: number) => {
      if (hasMoved) return;

      if (!isValidMove(board, boardIndex, cellIndex)) {
        setShakeBoard(boardIndex);
        setTimeout(() => setShakeBoard(null), 500);
        setFeedback("Play in the glowing board!");

        return;
      }

      const newBoard = makeMove(board, boardIndex, cellIndex);

      setBoard(newBoard);
      setHasMoved(true);
      setFeedback(
        `Opponent must play in the ${getBoardPositionName(cellIndex)} board!`,
      );
    },
    [board, hasMoved],
  );

  const isCellAvailable = useCallback(
    (boardIndex: number, cellIndex: number) => {
      if (hasMoved) return false;

      return isValidMove(board, boardIndex, cellIndex);
    },
    [board, hasMoved],
  );

  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setFeedback(null);
    setHasMoved(false);
  }, []);

  const isFreeMove =
    board.nextBoard !== null &&
    board.boards[board.nextBoard].status !== "InProgress";

  const activeBoard = isFreeMove ? null : board.nextBoard;

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              board.currentPlayer === "X"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {board.currentPlayer}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {hasMoved ? "Board frozen" : "Your turn"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Board */}
      <div ref={containerRef} className="relative flex justify-center">
        <div className="relative w-full max-w-lg">
          <motion.div
            animate={shakeBoard !== null ? { x: [0, -5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Board
              board={convertToBoardType(board)}
              className="shadow-none max-w-none"
              isCellAvailable={!hasMoved ? isCellAvailable : undefined}
              lastMove={board.lastMove}
              nextBoard={activeBoard}
              nextPlayer={board.currentPlayer}
              onCellClick={handleCellClick}
            />
          </motion.div>

          {/* Feedback tooltip */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <FloatingTooltip visible={feedback !== null}>
              {feedback}
            </FloatingTooltip>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-3 text-center">
        <AnimatePresence mode="wait">
          {hasMoved ? (
            <motion.p
              key="frozen"
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400"
              exit={{ opacity: 0, y: -5 }}
              initial={{ opacity: 0, y: 5 }}
            >
              {feedback}
            </motion.p>
          ) : isFreeMove ? (
            <motion.p
              key="free"
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold text-amber-600 dark:text-amber-400"
              exit={{ opacity: 0, y: -5 }}
              initial={{ opacity: 0, y: 5 }}
            >
              Free move! Click any glowing board.
            </motion.p>
          ) : activeBoard !== null ? (
            <motion.p
              key="active"
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-500 dark:text-gray-400"
              exit={{ opacity: 0, y: -5 }}
              initial={{ opacity: 0, y: 5 }}
            >
              You must play in the{" "}
              <strong className="text-blue-600 dark:text-blue-400">
                {getBoardPositionName(activeBoard)}
              </strong>{" "}
              board
            </motion.p>
          ) : (
            <motion.p
              key="free"
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-500 dark:text-gray-400"
              exit={{ opacity: 0, y: -5 }}
              initial={{ opacity: 0, y: 5 }}
            >
              Free move! Click any board.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
