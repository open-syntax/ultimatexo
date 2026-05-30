import { motion } from "framer-motion";

export type Cell = "X" | "O" | null;

export type MiniBoard = {
  cells: Cell[];
  status: "InProgress" | "X" | "O" | "Draw";
};

export type DemoBoardState = {
  boards: MiniBoard[];
  status: null | "X" | "O" | "Draw";
  nextBoard: number | null;
  lastMove: [number, number] | null;
  currentPlayer: "X" | "O";
};

export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function checkMiniWinner(cells: Cell[]): "X" | "O" | "Draw" | null {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }

  if (cells.every((c) => c !== null)) return "Draw";

  return null;
}

export function getBoardPositionName(index: number): string {
  const names = [
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-center",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];

  return names[index] ?? "unknown";
}

export function getBoardPositionLabel(index: number): string {
  const labels = [
    "Top-Left",
    "Top-Center",
    "Top-Right",
    "Middle-Left",
    "Middle-Center",
    "Middle-Right",
    "Bottom-Left",
    "Bottom-Center",
    "Bottom-Right",
  ];

  return labels[index] ?? "Unknown";
}

export function createEmptyBoard(): DemoBoardState {
  return {
    boards: Array.from({ length: 9 }, () => ({
      cells: Array(9).fill(null) as Cell[],
      status: "InProgress" as const,
    })),
    status: null,
    nextBoard: null,
    lastMove: null,
    currentPlayer: "X",
  };
}

export function cellIndexToBoardIndex(cellIndex: number): number {
  return cellIndex;
}

export interface ArrowDef {
  fromBoard: number;
  fromCell: number;
  toBoard: number;
  color: string;
}

export function CurvedArrow({
  fromX,
  fromY,
  toX,
  toY,
  color = "#3b82f6",
  delay = 0,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color?: string;
  delay?: number;
}) {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.3, 40);
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const cx = mx + perpX * offset;
  const cy = my + perpY * offset;

  const d = `M ${fromX} ${fromY} Q ${cx} ${cy} ${toX} ${toY}`;

  const angle = Math.atan2(toY - cy, toX - cx);
  const arrowLen = 8;
  const arrow1x = toX - arrowLen * Math.cos(angle - Math.PI / 6);
  const arrow1y = toY - arrowLen * Math.sin(angle - Math.PI / 6);
  const arrow2x = toX - arrowLen * Math.cos(angle + Math.PI / 6);
  const arrow2y = toY - arrowLen * Math.sin(angle + Math.PI / 6);

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 20 }}
    >
      <motion.path
        animate={{ pathLength: 1, opacity: 1 }}
        d={d}
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        stroke={color}
        strokeLinecap="round"
        strokeWidth={3}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
      />
      <motion.polygon
        animate={{ opacity: 1, scale: 1 }}
        fill={color}
        initial={{ opacity: 0, scale: 0 }}
        points={`${toX},${toY} ${arrow1x},${arrow1y} ${arrow2x},${arrow2y}`}
        style={{ transformOrigin: `${toX}px ${toY}px` }}
        transition={{ duration: 0.3, delay: delay + 0.5 }}
      />
    </svg>
  );
}

export function FloatingTooltip({
  children,
  visible,
}: {
  children: React.ReactNode;
  visible: boolean;
}) {
  return (
    <motion.div
      animate={visible ? { opacity: 1, y: -8 } : { opacity: 0, y: 10 }}
      className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-full"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg whitespace-nowrap">
        {children}
      </div>
      <div className="mx-auto h-0 w-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
    </motion.div>
  );
}
