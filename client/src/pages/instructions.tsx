import type { MouseEvent } from "react";

import { Card, CardBody } from "@heroui/card";
import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import DefaultLayout from "@/layouts/default";
import { Footer } from "@/components/footer";
import Board from "@/components/room/board";
import { O, X } from "@/components/icons";
import { Board as BoardType, BoardStatus } from "@/types";
import { usePageMeta } from "@/hooks/usePageMeta";
import allBoardStates from "@/data/board-states.json";
import { AutoPlayDemo, BackAndForthDemo } from "@/components/instructions";

const guideSections = [
  { id: "overview", label: "Overview" },
  { id: "basics", label: "The Basics" },
  { id: "mechanics", label: "How It Works" },
  { id: "special-rules", label: "Special Rules" },
  { id: "quick-reference", label: "Quick Reference" },
  { id: "strategy", label: "Strategy Tips" },
  { id: "video", label: "Video Tutorial" },
  { id: "faq", label: "FAQ" },
];

function AccordionSection({
  id,
  title,
  isOpen = false,
  onToggle,
  prefersReducedMotion = false,
  children,
}: {
  id: string;
  title: string;
  isOpen?: boolean;
  onToggle?: () => void;
  prefersReducedMotion?: boolean | null;
  children: React.ReactNode;
}) {
  const duration = prefersReducedMotion ? 0 : 0.25;

  return (
    <Card
      className="border-foreground-100/70 bg-content1/85 scroll-mt-24 relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl"
      id={id}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_60%)]" />
      <div className="relative">
        <button
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between p-5 text-left"
          type="button"
          onClick={() => onToggle?.()}
        >
          <div className="flex items-center gap-3">
            <span className="bg-primary h-6 w-1 rounded-full" />
            <h2 className="text-foreground-900 dark:text-foreground text-xl font-bold tracking-tight">
              {title}
            </h2>
          </div>
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-foreground-400 h-5 w-5 shrink-0"
            fill="none"
            initial={false}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            transition={{ duration }}
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </motion.svg>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration, ease: "easeInOut" }}
            >
              <CardBody className="gap-6 px-5 pb-5 pt-0">{children}</CardBody>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function BoardLegend({
  boards,
  lastMove,
  nextBoard,
  nextPlayer,
}: {
  boards: { cells: (string | null)[]; status: string }[];
  lastMove: [number, number] | null;
  nextBoard: number | null;
  nextPlayer: "X" | "O";
}) {
  const hasWonX = boards.some((b) => b.status === "X");
  const hasWonO = boards.some((b) => b.status === "O");
  const hasLastMove =
    lastMove !== null &&
    lastMove[0] < boards.length &&
    boards[lastMove[0]].status !== "X" &&
    boards[lastMove[0]].status !== "O";
  const hasActiveBoard =
    nextBoard !== null ||
    (boards.some((b) => b.status === "InProgress") &&
      boards.some((b) => b.cells.some((c) => c !== null)));
  const lastMoveGlow = nextPlayer === "X" ? "danger" : "primary";
  const activeBorder = nextPlayer === "X" ? "border-primary" : "border-danger";

  if (!hasWonX && !hasWonO && !hasLastMove && !hasActiveBoard) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {hasWonX && (
        <div className="flex items-center gap-1.5">
          <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded">
            <X className="text-primary" size={14} strokeWidth={3} />
          </div>
          <span className="text-foreground-600 text-xs">Won by X</span>
        </div>
      )}
      {hasWonO && (
        <div className="flex items-center gap-1.5">
          <div className="bg-danger/10 flex h-6 w-6 items-center justify-center overflow-visible rounded">
            <O
              className="text-danger"
              size={14}
              strokeWidth={2}
              viewBox="0 0 24 24"
            />
          </div>
          <span className="text-foreground-600 text-xs">Won by O</span>
        </div>
      )}
      {hasLastMove && (
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded ${
              lastMoveGlow === "primary"
                ? "bg-primary/10 shadow-[inset_0_0_4px_rgba(59,130,246,0.5)]"
                : "bg-danger/10 shadow-[inset_0_0_4px_rgba(239,68,68,0.5)]"
            }`}
          />
          <span className="text-foreground-600 text-xs">Last move</span>
        </div>
      )}
      {hasActiveBoard && (
        <div className="flex items-center gap-1.5">
          <div
            className={`${activeBorder} flex h-6 w-6 items-center justify-center rounded border-2`}
          />
          <span className="text-foreground-600 text-xs">Active board</span>
        </div>
      )}
    </div>
  );
}

function Instructions() {
  usePageMeta({
    title: "How to Play Ultimate Tic-Tac-Toe - Rules & Strategy Guide",
    description:
      "Learn how to play Ultimate Tic-Tac-Toe. Complete rules, gameplay mechanics, strategy tips, and a video tutorial to master the game.",
    path: "/instructions",
  });

  const [boardPreviewIndex, setBoardPreviewIndex] = useState(() =>
    Math.floor(Math.random() * allBoardStates.length),
  );

  const boardPreviewData = allBoardStates[boardPreviewIndex];

  const cycleBoard = useCallback(() => {
    setBoardPreviewIndex((prev) => {
      let next = Math.floor(Math.random() * allBoardStates.length);

      while (next === prev && allBoardStates.length > 1) {
        next = Math.floor(Math.random() * allBoardStates.length);
      }

      return next;
    });
  }, []);

  const nextPlayer: "X" | "O" = (() => {
    const marks = boardPreviewData.boards.flatMap(
      (b: { cells: (string | null)[] }) => b.cells,
    );
    const totalMarks = marks.filter((c: string | null) => c !== null).length;

    return totalMarks % 2 === 0 ? "X" : "O";
  })();

  const prefersReducedMotion = useReducedMotion();

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(["basics"]),
  );

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const openSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);

      next.add(id);

      return next;
    });
  }, []);

  const handleSidebarClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      openSection(id);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    },
    [openSection],
  );

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");

    if (hash && guideSections.some((s) => s.id === hash)) {
      openSection(hash);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }

    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [openSection]);

  return (
    <DefaultLayout>
      <div className="mx-auto grid max-w-7xl gap-6 pb-12 lg:grid-cols-[270px_1fr]">
        <motion.aside
          animate={{ opacity: 1, x: 0 }}
          className="lg:sticky lg:top-8 lg:h-fit"
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        >
          <Card className="border-foreground-100/70 bg-content1/85 border p-5 shadow-lg backdrop-blur-sm">
            <CardBody className="gap-6 p-0">
              <div className="space-y-1">
                <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
                  Game Guide
                </p>
                <p className="text-foreground-600 text-sm">
                  Learn every rule in one page
                </p>
              </div>

              <nav className="space-y-2">
                {guideSections.map((section) => (
                  <a
                    key={section.id}
                    className={`block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      openSections.has(section.id)
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "text-foreground-700 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground-900 dark:text-foreground-500 dark:hover:text-foreground border-transparent"
                    }`}
                    href={`#${section.id}`}
                    onClick={(e) => handleSidebarClick(e, section.id)}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>

              <div className="border-primary/30 bg-primary/10 rounded-xl border p-4">
                <p className="text-primary text-xs font-black tracking-[0.1em] uppercase">
                  Pro Tip
                </p>
                <p className="text-foreground-700 dark:text-foreground-300 mt-2 text-sm leading-relaxed">
                  The game is about tempo. Good players do not just place an X
                  or O, they decide where the next battle happens.
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.aside>

        <div className="space-y-4">
          {/* === Overview (always open, not accordion) === */}
          <motion.header
            animate={{ opacity: 1, y: 0 }}
            className="border-foreground-100/70 bg-content1/85 scroll-mt-24 relative overflow-hidden rounded-2xl border p-5 shadow-lg md:p-7"
            id="overview"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.1,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_60%)]" />
            <div className="relative space-y-4">
              <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
                Rules and Fundamentals
              </p>
              <h1 className="text-foreground-900 dark:text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
                How to Play Ultimate Tic-Tac-Toe
              </h1>
              <p className="text-foreground-700 dark:text-foreground-300 max-w-3xl text-lg leading-relaxed">
                Ultimate Tic-Tac-Toe is a recursive board game played on a 3x3
                grid of 3x3 boards. You win by taking control of local boards
                and lining up three won locals on the global board.
              </p>

              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="border-foreground-100/70 bg-content2/70 rounded-xl border px-4 py-3">
                  <p className="text-foreground-900 dark:text-foreground text-xl font-black">
                    9
                  </p>
                  <p className="text-foreground-600 text-xs tracking-wide uppercase">
                    Local boards
                  </p>
                </div>
                <div className="border-foreground-100/70 bg-content2/70 rounded-xl border px-4 py-3">
                  <p className="text-foreground-900 dark:text-foreground text-xl font-black">
                    81
                  </p>
                  <p className="text-foreground-600 text-xs tracking-wide uppercase">
                    Total cells
                  </p>
                </div>
                <div className="border-foreground-100/70 bg-content2/70 rounded-xl border px-4 py-3">
                  <p className="text-foreground-900 dark:text-foreground text-xl font-black">
                    1 Goal
                  </p>
                  <p className="text-foreground-600 text-xs tracking-wide uppercase">
                    3 boards in a row
                  </p>
                </div>
              </div>
            </div>
          </motion.header>

          {/* === The Basics === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.2,
            }}
          >
            <AccordionSection
              id="basics"
              isOpen={openSections.has("basics")}
              prefersReducedMotion={prefersReducedMotion}
              title="The Basics"
              onToggle={() => toggleSection("basics")}
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-foreground-100/70 bg-content1/80 px-3 py-2 sm:p-5">
                  <Board
                    board={
                      boardPreviewData as unknown as {
                        boards: BoardType;
                        status: BoardStatus | null;
                      }
                    }
                    className="pointer-events-none mx-auto mt-2 max-w-[min(100%,42rem)] shadow-none"
                    lastMove={
                      (
                        boardPreviewData as unknown as {
                          last_move?: [number, number] | null;
                        }
                      ).last_move ?? null
                    }
                    nextBoard={
                      (
                        boardPreviewData as unknown as {
                          next_board?: number | null;
                        }
                      ).next_board ?? null
                    }
                    nextPlayer={nextPlayer}
                  />
                  <p className="text-foreground-600 mt-3 text-center text-xs leading-relaxed sm:text-sm">
                    This is a real game board from an actual match. Study the
                    two layers: 9 local boards working toward the global win.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-foreground-100/50 pt-3">
                    <BoardLegend
                      boards={
                        boardPreviewData.boards as {
                          cells: (string | null)[];
                          status: string;
                        }[]
                      }
                      lastMove={
                        (
                          boardPreviewData as unknown as {
                            last_move?: [number, number] | null;
                          }
                        ).last_move ?? null
                      }
                      nextBoard={
                        (
                          boardPreviewData as unknown as {
                            next_board?: number | null;
                          }
                        ).next_board ?? null
                      }
                      nextPlayer={nextPlayer}
                    />
                    <button
                      className="text-primary hover:text-primary-600 flex shrink-0 items-center gap-1 text-xs font-semibold transition-colors"
                      type="button"
                      onClick={cycleBoard}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      New example
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Local Boards
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Every local board behaves like classic Tic-Tac-Toe. Win
                        one by getting three of your marks in a row, column, or
                        diagonal.
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Global Win Condition
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Each local win becomes your claim on the global 3x3
                        grid. Win three global squares in a row, column, or
                        diagonal to win the match.
                      </p>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </AccordionSection>
          </motion.div>

          {/* === How It Works (Complete Rewrite) === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.3,
            }}
          >
            <AccordionSection
              id="mechanics"
              isOpen={openSections.has("mechanics")}
              prefersReducedMotion={prefersReducedMotion}
              title="How It Works"
              onToggle={() => toggleSection("mechanics")}
            >
              <div className="space-y-10">
                {/* The Hook */}
                <div className="text-center space-y-2">
                  <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
                    The One Rule
                  </p>
                  <h3 className="text-foreground-900 dark:text-foreground text-2xl font-bold">
                    Where you place is where they go next.
                  </h3>
                  <p className="text-foreground-600 dark:text-foreground-400 text-sm">
                    No walls of text. Just watch, try, and play.
                  </p>
                </div>

                {/* Step 1: Watch */}
                <div>
                  <p className="text-foreground-700 dark:text-foreground-300 text-sm font-semibold mb-3">
                    1. Watch the rule in action
                  </p>
                  <AutoPlayDemo />
                </div>

                {/* Step 2: Try */}
                <Card className="border-primary/30 bg-primary/5 border p-4">
                  <CardBody className="gap-2 p-0">
                    <h3 className="text-primary text-base font-bold">
                      Your move = their destination
                    </h3>
                    <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                      Every move does two things: places your mark and tells
                      your opponent which board they must play on next. Play in
                      the <strong>top-right cell</strong> of any board and your
                      opponent is sent to the <strong>top-right board</strong>.
                      Think of each cell as a compass — it points to one of the
                      9 big boards.
                    </p>
                  </CardBody>
                </Card>

                {/* Step 3: Play */}
                <div>
                  <p className="text-foreground-700 dark:text-foreground-300 text-sm font-semibold mb-3">
                    3. Play back-and-forth
                  </p>
                  <BackAndForthDemo />
                </div>
              </div>
            </AccordionSection>
          </motion.div>

          {/* === Special Rules === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.4,
            }}
          >
            <AccordionSection
              id="special-rules"
              isOpen={openSections.has("special-rules")}
              prefersReducedMotion={prefersReducedMotion}
              title="Special Rules"
              onToggle={() => toggleSection("special-rules")}
            >
              <div className="space-y-4">
                <Card className="border-primary/40 bg-content1/80 border p-5">
                  <CardBody className="gap-2 p-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black">
                        1
                      </span>
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Send to Full Rule
                      </h3>
                    </div>
                    <p className="text-foreground-700 dark:text-foreground-300 mt-2 text-sm leading-relaxed">
                      If your opponent sends you to a board that is already won
                      or full, you are free to play in any open local board.
                      This is called a free move and is a powerful strategic
                      opportunity.
                    </p>
                  </CardBody>
                </Card>

                <Card className="border-danger/40 bg-content1/80 border p-5">
                  <CardBody className="gap-2 p-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-danger text-danger-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black">
                        2
                      </span>
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Tied Local Boards
                      </h3>
                    </div>
                    <p className="text-foreground-700 dark:text-foreground-300 mt-2 text-sm leading-relaxed">
                      A tied local board does not belong to either player. It
                      acts as a blocked square on the global grid and cannot be
                      used for any win line.
                    </p>
                  </CardBody>
                </Card>

                <Card className="border-warning/40 bg-content1/80 border p-5">
                  <CardBody className="gap-2 p-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-warning text-warning-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black">
                        3
                      </span>
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Draw Condition
                      </h3>
                    </div>
                    <p className="text-foreground-700 dark:text-foreground-300 mt-2 text-sm leading-relaxed">
                      If every local board is resolved (won or tied) and no
                      player has three in a row on the global board, the game
                      ends in a draw.
                    </p>
                  </CardBody>
                </Card>
              </div>
            </AccordionSection>
          </motion.div>

          {/* === Quick Reference === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.5,
            }}
          >
            <AccordionSection
              id="quick-reference"
              isOpen={openSections.has("quick-reference")}
              prefersReducedMotion={prefersReducedMotion}
              title="Quick Reference"
              onToggle={() => toggleSection("quick-reference")}
            >
              <div className="grid gap-3">
                {[
                  {
                    q: "Can I play anywhere every turn?",
                    a: "No. Only on your very first move, or when sent to a board that is already won or full.",
                    indicator: "1",
                    indicatorClass: "bg-primary text-primary-foreground",
                  },
                  {
                    q: "How do I win a local board?",
                    a: "Three of your marks in a row, column, or diagonal, just like classic Tic-Tac-Toe.",
                    indicator: "2",
                    indicatorClass: "bg-emerald-500 text-white",
                  },
                  {
                    q: "How do I win the full game?",
                    a: "Claim three local boards in a global row, column, or diagonal.",
                    indicator: "3",
                    indicatorClass: "bg-amber-500 text-white",
                  },
                  {
                    q: "What if my destination is full?",
                    a: "You get a free move and may choose any open local board to play in.",
                    indicator: "4",
                    indicatorClass: "bg-danger text-white",
                  },
                ].map((item) => (
                  <Card
                    key={item.q}
                    className="border-foreground-100/70 bg-content1/80 border p-4"
                  >
                    <CardBody className="flex flex-row gap-3 p-0">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${item.indicatorClass}`}
                      >
                        {item.indicator}
                      </span>
                      <div>
                        <p className="text-foreground-900 dark:text-foreground text-sm font-bold">
                          {item.q}
                        </p>
                        <p className="text-foreground-700 dark:text-foreground-300 mt-0.5 text-sm leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionSection>
          </motion.div>

          {/* === Strategy Tips === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.6,
            }}
          >
            <AccordionSection
              id="strategy"
              isOpen={openSections.has("strategy")}
              prefersReducedMotion={prefersReducedMotion}
              title="Strategy Tips"
              onToggle={() => toggleSection("strategy")}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Control the Center",
                    tip: "Center cells and center local boards influence the highest number of possible lines. Prioritize them early.",
                    icon: (
                      <svg
                        className="text-primary h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" fill="currentColor" r="2" />
                      </svg>
                    ),
                  },
                  {
                    title: "Avoid Free Turns",
                    tip: "Sending your opponent to a closed board gives them a free move anywhere. Only do this when it serves your strategy.",
                    icon: (
                      <svg
                        className="text-amber-500 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" x2="12" y1="9" y2="13" />
                        <line x1="12" x2="12.01" y1="17" y2="17" />
                      </svg>
                    ),
                  },
                  {
                    title: "Think Two Moves Ahead",
                    tip: "Every turn is both placement and routing. Predict where your move sends your opponent, then where they will send you back.",
                    icon: (
                      <svg
                        className="text-emerald-500 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    ),
                  },
                  {
                    title: "Build Double Threats",
                    tip: "Set up positions where the opponent must answer one threat while giving you progress in another local board.",
                    icon: (
                      <svg
                        className="text-purple-500 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <Card
                    key={item.title}
                    className="border-foreground-100/70 bg-content1/80 border p-5"
                  >
                    <CardBody className="gap-2 p-0">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">{item.icon}</span>
                        <div>
                          <h3 className="text-foreground-900 dark:text-foreground text-base font-bold">
                            {item.title}
                          </h3>
                          <p className="text-foreground-700 dark:text-foreground-300 mt-1 text-sm leading-relaxed">
                            {item.tip}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionSection>
          </motion.div>

          {/* === Video Tutorial === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.7,
            }}
          >
            <AccordionSection
              id="video"
              isOpen={openSections.has("video")}
              prefersReducedMotion={prefersReducedMotion}
              title="Video Tutorial"
              onToggle={() => toggleSection("video")}
            >
              <Card className="border-foreground-100/70 bg-content1/70 overflow-hidden border p-1">
                <CardBody className="p-0">
                  <iframe
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    className="aspect-video w-full rounded-lg"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src="https://www.youtube.com/embed/37PC0bGMiTI"
                    title="Ultimate Tic-Tac-Toe: The Rules"
                  />
                </CardBody>
              </Card>
            </AccordionSection>
          </motion.div>

          {/* === FAQ === */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: 0.8,
            }}
          >
            <AccordionSection
              id="faq"
              isOpen={openSections.has("faq")}
              prefersReducedMotion={prefersReducedMotion}
              title="FAQ"
              onToggle={() => toggleSection("faq")}
            >
              <div className="space-y-3">
                {[
                  {
                    q: "Can I keep playing in a local board after someone wins it?",
                    a: "No. Once a local board is won, it is closed and permanently owned by that player on the global board.",
                    badge: "bg-danger text-white",
                    indicator: "1",
                  },
                  {
                    q: "Do tied local boards count for either player?",
                    a: "No. Ties belong to no one and only reduce the number of available win lines on the global grid.",
                    badge: "bg-warning text-white",
                    indicator: "2",
                  },
                  {
                    q: "Can I force my opponent into a bad board?",
                    a: "Yes. Routing is a core strategic tool. Strong players send opponents to boards where they have few good options.",
                    badge: "bg-primary text-white",
                    indicator: "3",
                  },
                ].map((item) => (
                  <Card
                    key={item.q}
                    className="border-foreground-100/70 bg-content1/80 border p-5"
                  >
                    <CardBody className="flex flex-row gap-3 p-0">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${item.badge}`}
                      >
                        {item.indicator}
                      </span>
                      <div>
                        <h3 className="text-foreground-900 dark:text-foreground text-sm font-bold md:text-base">
                          {item.q}
                        </h3>
                        <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionSection>
          </motion.div>
        </div>
      </div>

      <Footer />
    </DefaultLayout>
  );
}

export default Instructions;
