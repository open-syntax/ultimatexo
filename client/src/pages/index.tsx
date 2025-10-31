import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { button as buttonStyles } from "@heroui/theme";
import { useNavigate, Link } from "react-router-dom";

import { Controller, Dice, Group } from "@/components/icons";
import { title } from "@/components/primitives";
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
      <section className="flex h-full flex-col items-center justify-center gap-8 py-8 md:py-10">
        <div className="inline-block max-w-lg justify-center text-center">
          <span className={title({ color: "yellow" })}>Ultimate</span>
          <span className={title()}>XO</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <Link
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })}
              to="/create"
            >
              <Controller />
              Play
            </Link>
            <Link
              className={buttonStyles({ variant: "bordered", radius: "full" })}
              to="/rooms"
            >
              <Group />
              Rooms
            </Link>
            <Link
              className={`aspect-square !min-w-8 !p-1 ${buttonStyles({ variant: "bordered", radius: "full" })}`}
              title="Random room"
              to="/quick"
            >
              <Dice size={20} />
            </Link>
          </div>

          <p className="before:bg-default-400 after:bg-default-400 relative w-full text-center before:absolute before:top-1/2 before:-left-4 before:h-px before:w-1/2 before:translate-y-1/2 before:content-[''] after:absolute after:top-1/2 after:-right-4 after:h-px after:w-1/2 after:translate-y-1/2 after:content-['']">
            OR
          </p>

          <form className="flex gap-3" onSubmit={(e) => handleSubmit(e)}>
            <Input name="roomId" placeholder="Room ID" variant="bordered" />
            <Button color="primary" type="submit">
              Join
            </Button>
          </form>
        </div>

        <Link className="text-primary" to="/instructions">
          <span>Don&apos;t know how to play?</span>
        </Link>
      </section>
    </DefaultLayout>
  );
}
