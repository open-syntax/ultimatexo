import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { useNavigate } from "react-router-dom";

import { Controller, Group } from "@/components/icons";
import { subtitle, title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";


export default function IndexPage() {
  let navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);
    const roomId = data.get("roomId") as string;

    navigate(`/room/${roomId}`);
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title({ color: "yellow" })}>Ulitamte&nbsp;</span>
          <span className={title()}>Tic Tac Toe</span>
        </div>

        <div className="flex flex-col gap-3 items-center">
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

          <p className="w-full text-center relative before:w-1/2 before:content-[''] after:w-1/2 after:content-[''] before:bg-default-400 after:bg-default-400 before:h-px after:h-px before:absolute after:absolute before:-left-4 after:-right-4 before:top-1/2 before:translate-y-1/2 after:top-1/2 after:translate-y-1/2">
            OR
          </p>

          <form className="flex gap-3" onSubmit={(e) => handleSubmit(e)}>
            <Input name="roomId" placeholder="Room ID" variant="bordered" />
            <Button color="primary" type="submit">
              Join
            </Button>
          </form>
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
