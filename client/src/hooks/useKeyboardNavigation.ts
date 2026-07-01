import { useCallback, useEffect, useRef } from "react";

type CellCoord = [number, number];

function toGlobal([board, cell]: CellCoord): [number, number] {
  return [
    Math.floor(board / 3) * 3 + Math.floor(cell / 3),
    (board % 3) * 3 + (cell % 3),
  ];
}

function fromGlobal([row, col]: [number, number]): CellCoord {
  return [
    Math.floor(row / 3) * 3 + Math.floor(col / 3),
    (row % 3) * 3 + (col % 3),
  ];
}

export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const keyboardModeRef = useRef(false);

  const focusCell = useCallback((coord: CellCoord) => {
    const [board, cell] = coord;
    const el = document.querySelector<HTMLElement>(
      `[data-board="${board}"][data-cell="${cell}"]`,
    );

    if (el && el.getAttribute("tabindex") === "0") {
      el.focus();

      return true;
    }

    return false;
  }, []);

  const findNextPlayable = useCallback(
    (
      start: CellCoord,
      direction: "up" | "down" | "left" | "right",
    ): CellCoord | null => {
      const [startRow, startCol] = toGlobal(start);
      const dRow = direction === "up" ? -1 : direction === "down" ? 1 : 0;
      const dCol = direction === "left" ? -1 : direction === "right" ? 1 : 0;

      let row = startRow;
      let col = startCol;

      for (let i = 0; i < 81; i++) {
        row = (row + dRow + 9) % 9;
        col = (col + dCol + 9) % 9;

        const [boardIdx, cellIdx] = fromGlobal([row, col]);
        const el = document.querySelector<HTMLElement>(
          `[data-board="${boardIdx}"][data-cell="${cellIdx}"]`,
        );

        if (el && el.getAttribute("tabindex") === "0") {
          return [boardIdx, cellIdx];
        }
      }

      return null;
    },
    [],
  );

  const findNextTabbable = useCallback(
    (startFlatIdx: number, direction: 1 | -1): CellCoord | null => {
      for (let i = 1; i <= 81; i++) {
        const flat = (startFlatIdx + i * direction + 81) % 81;
        const board = Math.floor(flat / 9);
        const cell = flat % 9;
        const el = document.querySelector<HTMLElement>(
          `[data-board="${board}"][data-cell="${cell}"]`,
        );

        if (el && el.getAttribute("tabindex") === "0") {
          return [board, cell];
        }
      }

      return null;
    },
    [],
  );

  const autoFocusFirstPlayable = useCallback((preferredBoard?: number) => {
    // If a specific board is preferred (nextBoard), search its 9 cells first
    if (preferredBoard !== undefined) {
      const start = preferredBoard * 9;

      for (let flat = start; flat < start + 9; flat++) {
        const board = Math.floor(flat / 9);
        const cell = flat % 9;
        const el = document.querySelector<HTMLElement>(
          `[data-board="${board}"][data-cell="${cell}"]`,
        );

        if (el && el.getAttribute("tabindex") === "0") {
          el.focus();

          return;
        }
      }
    }

    // Fallback: search globally from flat 0
    for (let flat = 0; flat < 81; flat++) {
      const board = Math.floor(flat / 9);
      const cell = flat % 9;
      const el = document.querySelector<HTMLElement>(
        `[data-board="${board}"][data-cell="${cell}"]`,
      );

      if (el && el.getAttribute("tabindex") === "0") {
        el.focus();

        return;
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;

      if (!active || !container.contains(active)) return;

      const boardAttr = active.getAttribute("data-board");
      const cellAttr = active.getAttribute("data-cell");

      if (!boardAttr || !cellAttr) return;

      // Track that user is actively using keyboard navigation.
      keyboardModeRef.current = true;

      const current: CellCoord = [
        parseInt(boardAttr, 10),
        parseInt(cellAttr, 10),
      ];

      let target: CellCoord | null = null;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          target = findNextPlayable(current, "up");
          break;
        case "ArrowDown":
          e.preventDefault();
          target = findNextPlayable(current, "down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          target = findNextPlayable(current, "left");
          break;
        case "ArrowRight":
          e.preventDefault();
          target = findNextPlayable(current, "right");
          break;
        case "Tab": {
          e.preventDefault();
          const currentFlat = current[0] * 9 + current[1];

          target = findNextTabbable(currentFlat, e.shiftKey ? -1 : 1);
          break;
        }
        case "Escape": {
          e.preventDefault();
          keyboardModeRef.current = false;
          (active as HTMLElement).blur();
          break;
        }
        default:
          return;
      }

      if (target) {
        focusCell(target);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        target &&
        target.getAttribute("data-board") &&
        target.getAttribute("data-cell")
      ) {
        // User clicked a cell with the mouse — exit keyboard mode.
        keyboardModeRef.current = false;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef, findNextPlayable, findNextTabbable, focusCell]);

  return { autoFocusFirstPlayable, keyboardModeRef };
}
