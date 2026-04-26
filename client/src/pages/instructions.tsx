import { Card, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import DefaultLayout from "@/layouts/default";
import { Footer } from "@/components/footer";
import Board from "@/components/room/board";
import { Board as BoardType, BoardStatus } from "@/types";
import { useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import allBoardStates from "@/data/board-states.json";

const guideSections = [
  { id: "overview", label: "Overview" },
  { id: "basics", label: "The Basics" },
  { id: "mechanics", label: "Gameplay Mechanics" },
  { id: "special-rules", label: "Special Rules" },
  { id: "quick-reference", label: "Quick Reference" },
  { id: "strategy", label: "Strategy Tips" },
  { id: "video", label: "Video Tutorial" },
  { id: "faq", label: "FAQ" },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="bg-primary h-8 w-1 rounded-full" />
      <h2 className="text-foreground-900 dark:text-foreground text-2xl font-bold tracking-tight">
        {title}
      </h2>
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

  const boardPreviewData = useMemo(
    () => allBoardStates[Math.floor(Math.random() * allBoardStates.length)],
    [],
  );

  const nextPlayer: "X" | "O" = (() => {
    const marks = boardPreviewData.boards.flatMap(
      (b: { cells: (string | null)[] }) => b.cells,
    );
    const totalMarks = marks.filter((c: string | null) => c !== null).length;
    return totalMarks % 2 === 0 ? "X" : "O";
  })();

  return (
    <DefaultLayout>
      <div className="h-full min-h-0">
        <div className="scrollbar-hide h-full overflow-y-auto pr-1">
          <div
            className="mx-auto grid max-w-7xl gap-6 pb-12 lg:grid-cols-[270px_1fr]"
            id="overview"
          >
            <aside className="lg:sticky lg:top-8 lg:h-fit">
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
                        className="text-foreground-700 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground-900 dark:text-foreground-500 dark:hover:text-foreground block rounded-lg border border-transparent px-3 py-2 text-sm font-semibold transition"
                        href={`#${section.id}`}
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
                      The game is about tempo. Good players do not just place an
                      X or O, they decide where the next battle happens.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </aside>

            <div className="space-y-12">
              <header className="border-foreground-100/70 bg-content1/85 relative overflow-hidden rounded-2xl border p-5 md:p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_60%)]" />
                <div className="relative space-y-4">
                  <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
                    Rules and Fundamentals
                  </p>
                  <h1 className="text-foreground-900 dark:text-foreground text-4xl leading-tight font-black tracking-tight md:text-5xl">
                    How to Play Ultimate Tic-Tac-Toe
                  </h1>
                  <p className="text-foreground-700 dark:text-foreground-300 max-w-3xl text-lg leading-relaxed">
                    Ultimate Tic-Tac-Toe is a recursive board game played on a
                    3x3 grid of 3x3 boards. You win by taking control of local
                    boards and lining up three won locals on the global board.
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
              </header>

              <section className="scroll-mt-24" id="basics">
                <SectionTitle title="The Basics" />

                <div className="space-y-4">
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="items-center gap-4 p-0">
                      <Board
                        board={
                          boardPreviewData as unknown as {
                            boards: BoardType;
                            status: BoardStatus | null;
                          }
                        }
                        className="pointer-events-none mt-3 max-w-[min(100%,42rem)] shadow-none"
                        nextPlayer={nextPlayer}
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
                      />
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        This is the real in-game board component. The main board
                        contains 9 local boards, and each local board contains 9
                        cells.
                      </p>
                    </CardBody>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                      <CardBody className="gap-2 p-0">
                        <h3 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                          Local Boards
                        </h3>
                        <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                          Every local board behaves like classic Tic-Tac-Toe.
                          Win one by getting three of your marks in a row.
                        </p>
                      </CardBody>
                    </Card>
                    <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                      <CardBody className="gap-2 p-0">
                        <h3 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                          Global Win Condition
                        </h3>
                        <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                          Each local win claims one global square. First player
                          to align three claimed global squares wins the match.
                        </p>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </section>

              <section className="scroll-mt-24" id="mechanics">
                <SectionTitle title="Gameplay Mechanics" />

                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <span className="border-primary/50 bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black">
                      1
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                        Start Anywhere
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        On turn one, you may place your mark in any empty cell
                        on any local board.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="border-primary/50 bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black">
                      2
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                        Send Your Opponent
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        The cell you play in sets your opponent&apos;s
                        destination. If you play the top-right cell, they must
                        play in the top-right local board.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="border-primary/50 bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black">
                      3
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                        Claim Local Boards
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        As soon as you make three in a row in a local board,
                        that board is permanently yours on the global grid.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="border-primary/50 bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black">
                      4
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-foreground-900 dark:text-foreground text-xl font-bold">
                        Build a Global Line
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Claim three local boards in a row, column, or diagonal
                        on the global board to win the match.
                      </p>
                    </div>
                  </li>
                </ol>
              </section>

              <section className="scroll-mt-24" id="special-rules">
                <SectionTitle title="Special Rules" />

                <div className="space-y-4">
                  <Card className="border-primary/40 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Send to Full Rule
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        If the destination board is already won or full, the
                        next player may move in any open local board.
                      </p>
                    </CardBody>
                  </Card>

                  <Card className="border-danger/40 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Tied Local Boards
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        A tied local board does not belong to either player.
                        Treat that global square as blocked for win lines.
                      </p>
                    </CardBody>
                  </Card>

                  <Card className="border-warning/40 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Draw Condition
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        If every local board is won or tied and no player has a
                        global 3-in-a-row, the game ends in a draw.
                      </p>
                    </CardBody>
                  </Card>
                </div>
              </section>

              <section className="scroll-mt-24" id="quick-reference">
                <SectionTitle title="Quick Reference" />

                <div className="grid gap-3">
                  {[
                    {
                      label: "Can I play anywhere every turn?",
                      value:
                        "No. Only on your first move, or when sent to a closed board.",
                    },
                    {
                      label: "How do I win a local board?",
                      value:
                        "Three of your marks in a line, just like classic Tic-Tac-Toe.",
                    },
                    {
                      label: "How do I win the full game?",
                      value:
                        "Claim three local boards in a global row, column, or diagonal.",
                    },
                    {
                      label: "What if my destination is full?",
                      value:
                        "You may choose any open local board on the next move.",
                    },
                  ].map((item) => (
                    <Card
                      key={item.label}
                      className="border-foreground-100/70 bg-content1/80 border p-5"
                    >
                      <CardBody className="p-0">
                        <p className="text-foreground-900 dark:text-foreground text-sm font-bold">
                          {item.label}
                        </p>
                        <p className="text-foreground-700 dark:text-foreground-300 mt-1 text-sm leading-relaxed">
                          {item.value}
                        </p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="scroll-mt-24" id="strategy">
                <SectionTitle title="Strategy Tips" />

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Control the Center
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Center cells and center local boards influence the
                        highest number of lines. Prioritize them when possible.
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Avoid Free Turns
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Sending your opponent to a closed board can give them a
                        strong free choice. Use that only when it helps you.
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Think Two Moves Ahead
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Every turn is both placement and routing. Consider where
                        your move sends the opponent, then where they can send
                        you.
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="border-foreground-100/70 bg-content1/80 border p-5">
                    <CardBody className="gap-2 p-0">
                      <h3 className="text-foreground-900 dark:text-foreground text-lg font-bold">
                        Build Double Threats
                      </h3>
                      <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                        Set up positions where the opponent must answer one
                        threat while giving you progress in another local board.
                      </p>
                    </CardBody>
                  </Card>
                </div>
              </section>

              <section className="scroll-mt-24" id="video">
                <SectionTitle title="Video Tutorial" />
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
              </section>

              <section className="scroll-mt-24" id="faq">
                <SectionTitle title="FAQ" />
                <div className="space-y-3">
                  {[
                    {
                      q: "Can I keep playing in a local board after someone wins it?",
                      a: "No. Once a local board is won, it is closed and owned on the global board.",
                    },
                    {
                      q: "Do tied local boards count for either player?",
                      a: "No. Ties claim no global ownership and only reduce available win lines.",
                    },
                    {
                      q: "Can I force my opponent into a bad board?",
                      a: "Yes. Routing is core to strategy. Strong players use this to create pressure.",
                    },
                  ].map((item) => (
                    <Card
                      key={item.q}
                      className="border-foreground-100/70 bg-content1/80 border p-5"
                    >
                      <CardBody className="gap-2 p-0">
                        <h3 className="text-foreground-900 dark:text-foreground text-sm font-bold md:text-base">
                          {item.q}
                        </h3>
                        <p className="text-foreground-700 dark:text-foreground-300 text-sm leading-relaxed">
                          {item.a}
                        </p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="border-foreground-100/70 border-t pt-8">
                <p className="text-foreground-600 text-center text-sm">
                  Ready to test your strategy?
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Link
                    className={`!rounded-lg ${buttonStyles({ color: "primary" })}`}
                    href="/create"
                  >
                    Start Game
                  </Link>
                  <Link
                    className={`!rounded-lg ${buttonStyles({ color: "default", variant: "flat" })}`}
                    href="/create?mode=bot"
                  >
                    Practice Mode
                  </Link>
                </div>
              </section>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </DefaultLayout>
  );
}

export default Instructions;
