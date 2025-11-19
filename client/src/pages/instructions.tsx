import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import DefaultLayout from "@/layouts/default";
import Board from "@/components/room/board";
import { BoardStatus, Board as BoardType } from "@/types";

const boardData = {
  boards: [
    {
      cells: [null, null, "X", null, null, "X", null, null, "X"],
      status: "X",
    },
    {
      cells: [null, "X", null, null, null, null, null, "O", null],
      status: null,
    },
    {
      cells: [null, "O", null, "O", null, null, null, null, null],
      status: null,
    },
    {
      cells: [null, null, null, "X", "X", "X", null, null, null],
      status: "X",
    },
    {
      cells: [null, null, "X", "O", "O", null, null, null, "X"],
      status: null,
    },
    {
      cells: ["O", null, null, "O", null, null, "O", null, null],
      status: "O",
    },
    {
      cells: [null, null, "X", null, null, null, null, null, "O"],
      status: null,
    },
    {
      cells: [null, null, null, null, null, null, "X", null, null],
      status: null,
    },
    {
      cells: ["O", null, null, "O", "X", null, null, null, null],
      status: null,
    },
  ],
  status: null,
};

function Instructions() {
  return (
    <DefaultLayout>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="h-fit border border-foreground-100 p-4" radius="sm">
          <CardHeader>
            <h1 className="text-2xl font-bold text-foreground-900">
              The Basics
            </h1>
          </CardHeader>
          <CardBody className="space-y-4 items-center">
            <p>
              UltimateXO is played on a 3x3 grid of smaller Tic-Tac-Toe, The
              goal is to win 3 smaller boards in a row, column, or diagonal to
              claim victory on the main grid.
            </p>
            <Board
              board={
                boardData as unknown as {
                  boards: BoardType;
                  status: BoardStatus | null;
                }
              }
            />
          </CardBody>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="border border-foreground-100 p-4" radius="sm">
            <CardHeader>
              <h1 className="text-2xl font-bold text-foreground-900">
                Gameplay mechanics
              </h1>
            </CardHeader>
            <CardBody>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  <span className="font-bold text-foreground-900">
                    Your first move
                  </span>{" "}
                  can be anywhere on the 9x9 grid.
                </li>
                <li>
                  <span className="font-bold text-foreground-900">
                    The twist:
                  </span>{" "}
                  The square you pick in a small board dictates the next board
                  your opponent must play in.
                </li>
                <li>
                  <span className="font-bold text-foreground-900">
                    Winning a small board:
                  </span>{" "}
                  Get three of your symbols in a row, column, or diagonal to win
                  the small board, Just like a normal Tic-Tac-Toe.
                </li>
                <li>
                  <span className="font-bold text-foreground-900">
                    Winning the game:
                  </span>{" "}
                  Win 3 small boards in a row, column, or diagonal in the main
                  grid to win the game.
                </li>
              </ol>
              <iframe
                className="mt-4 aspect-video w-full rounded-lg"
                src="https://www.youtube.com/embed/37PC0bGMiTI"
                title="Ultimate Tic-Tac-Toe: The Rules"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </CardBody>
          </Card>
          <Card className="border border-foreground-100 p-4" radius="sm">
            <CardHeader>
              <h1 className="text-2xl font-bold text-foreground-900">
                Special Rules
              </h1>
            </CardHeader>
            <CardBody>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <span className="font-bold text-foreground-900">
                    Sent to a won/full board?
                  </span>{" "}
                  if your opponent&apos;s move sends you to a board that&apos;s
                  already won or full, you can play on{" "}
                  <span className="font-bold text-primary">
                    any board avilable
                  </span>{" "}
                  on the entire grid.
                </li>
                <li>
                  <span className="font-bold text-foreground-900">Ties:</span>{" "}
                  If the entire grid is filled no one has won, the game is a
                  draw.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
      <Link
        className={`mt-8 self-center !rounded-md ${buttonStyles({ color: "primary" })}`}
        href="/create"
      >
        Ready to play?
      </Link>
    </DefaultLayout>
  );
}

export default Instructions;
