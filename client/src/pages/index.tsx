import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { Controller, Group } from "@/components/icons";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title({ color: "yellow" })}>Ulitamte&nbsp;</span>
          <span className={title()}>Tic Tac Toe</span>
        </div>

        <div className="flex gap-3">
          <Link
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href="#"
          >
            <Controller />
            Host
          </Link>
          <Link
            className={buttonStyles({ variant: "bordered", radius: "full" })}
            href="/rooms"
          >
            <Group />
            Rooms
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-center">
            <span className={`!text-2xl ${subtitle()}`}>Rules:</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc list-inside text-wrap">
            {/* <span>
              Just like in regular tic-tac-toe, starting with X. The game starts
            </span>
            <span>
              with X playing wherever they want in any of the 81 empty spots.
            </span>
            <span>
              Thereafter, each player moves in the small board corresponding to
            </span>
            <span>
              the position of the previous move in its small board, as indicated
            </span>
            <span>
              in the figures. If a move is played so that it wins a small board
              by
            </span>
            <span>
              the rules of normal tic-tac-toe, then the entire small board is
            </span>
            <span>marked as won by the player in the larger board.</span> */}
            <li>Tic Tac Toe is played on a 3x3 Tic Tac Toe boards.</li>
            <li>Player sent to the large board where the last move.</li>
            <li>Board is marked if player wins the small board.</li>
            <li>Board is marked? No problem play anywhere.</li>
            <li>
              Win the big board and you win. <b>Good Luck!</b>
            </li>
          </ul>
        </div>
      </section>
    </DefaultLayout>
  );
}
