import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import DefaultLayout from "@/layouts/default";

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
          <CardBody className="space-y-4">
            <p>
              Ultimate XO is played on a 3x3 grid of smaller
              Tic-Tac-Toe, The goal is to win 3 smaller boards in a row, column,
              or diagonal to claim victory on the main grid.
            </p>
            <img
              alt="board"
              className="aspect-square rounded-lg object-cover"
              src="/board.png"
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
