import { Button } from "@heroui/button";
import { button, card, cn } from "@heroui/theme";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { RadioGroup, Radio, RadioProps } from "@heroui/radio";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import RoomLayout from "@/layouts/room";
import DefaultLayout from "@/layouts/default";
import { Bot, Group, Network } from "@/components/icons";

const { base, header, body } = card();

type mode = "Online" | "Local" | "Bot";
type difficulty = "Beginner" | "Intermediate" | "Advanced";

const CustomRadio = ({ children, classNames, ...props }: RadioProps) => {
  return (
    <Radio
      classNames={{
        base: cn(
          "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between group",
          "flex-row-reverse max-w-[200px] cursor-pointer rounded-lg gap-4 p-4",
          "data-[selected=true]:bg-primary data-[selected=true]:text-white",
          "data-[selected=true]:shadow-[0_0_8px_1px] data-[selected=true]:shadow-primary",
          "[&>span]:data-[selected=true]:!border-white [&>span>span]:data-[selected=true]:!bg-white",
          classNames?.base,
        ),
        wrapper: cn(classNames?.wrapper),
        label: cn("flex items-center gap-2", classNames?.label),
      }}
      color="default"
      {...props}
    >
      {children}
    </Radio>
  );
};

const RoomForm = () => {
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<mode>("Online");
  const [difficulty, setDifficulty] = useState<difficulty>("Beginner");
  const navgiate = useNavigate();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    const data = new FormData(e.currentTarget);
    const password = (data.get("password") as string) || null;
    const name = (data.get("name") as string) || "";

    fetch(`/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body:
        mode === "Online"
          ? JSON.stringify({
              is_public: isPublic,
              name,
              password,
              room_type: "Standard",
            })
          : mode === "Local"
            ? JSON.stringify({ room_type: "LocalRoom" })
            : JSON.stringify({
                bot_level: difficulty,
                room_type: "BotRoom",
              }),
    })
      .then((response) => response.json())
      .then((data: { room_id: number }) => {
        navgiate(`/room/${data.room_id}`, {
          state: { roomId: data.room_id, password, isReconnecting: false },
        });
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <DefaultLayout>
      <RoomLayout>
        <div
          className={`${base()} ${body()} max-h-[calc(16rem+2rem)] min-w-[calc(200px+2rem)] max-w-xl px-4 py-4 max-sm:max-h-[calc(22rem+2rem)]`}
        >
          <h1
            className={`${header()} mx-auto !w-fit !text-center font-bold leading-4`}
          >
            Create Room
          </h1>
          <div className="flex h-full flex-row items-center gap-4 max-sm:flex-col">
            <RadioGroup
              classNames={{ wrapper: "max-sm:flex-row justify-center" }}
              defaultValue="Online"
              value={mode}
              onValueChange={(e) => setMode(e as mode)}
            >
              <CustomRadio
                classNames={{ base: "max-sm:h-fit max-sm:p-2" }}
                value="Online"
              >
                <Group /> Online
              </CustomRadio>
              <CustomRadio
                classNames={{ base: "max-sm:h-fit max-sm:p-2" }}
                value="Local"
              >
                <Network /> Local
              </CustomRadio>
              <CustomRadio
                classNames={{ base: "max-sm:h-fit max-sm:p-2" }}
                value="Bot"
              >
                <Bot /> Bot
              </CustomRadio>
            </RadioGroup>
            <div className="h-px w-full overflow-y-auto bg-foreground-400 sm:h-full sm:w-px" />
            <Form
              className="flexc-col flex h-full w-full"
              onSubmit={(e) => handleCreate(e)}
            >
              {["Online", "Local"].includes(mode) && (
                <div className="flex h-full w-full flex-col justify-center gap-2">
                  <Input
                    isDisabled={mode === "Local"}
                    label="Room Name"
                    name="name"
                    size="sm"
                  />
                  <Input
                    isDisabled={mode === "Local"}
                    label="Room Password"
                    name="password"
                    size="sm"
                    type="password"
                  />
                  <label
                    className={cn(
                      "relative flex cursor-pointer justify-around gap-2 rounded-full bg-content2 p-2",
                      "before:absolute before:left-1 before:top-1 before:h-[calc(100%-8px)] before:w-[calc(50%-2px)] before:rounded-full before:bg-primary before:transition before:content-['']",
                      !isPublic && "before:translate-x-[calc(100%-4px)]",
                      "*:z-10 *:select-none",
                      mode === "Local" && "cursor-default opacity-50",
                    )}
                    htmlFor="isPublic"
                  >
                    <input
                      checked={isPublic}
                      className="hidden"
                      id="isPublic"
                      type="checkbox"
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <span>Public</span>
                    <span>Private</span>
                  </label>
                </div>
              )}
              {mode === "Bot" && (
                <div className="flex h-full w-full flex-col justify-center">
                  <RadioGroup
                    classNames={{ wrapper: "justify-center" }}
                    defaultValue="Beginner"
                    value={difficulty}
                    onValueChange={(e) => setDifficulty(e as difficulty)}
                  >
                    <CustomRadio
                      classNames={{ base: "!max-w-full h-10" }}
                      value="Beginner"
                    >
                      Beginner
                    </CustomRadio>
                    <CustomRadio
                      classNames={{ base: "!max-w-full h-10" }}
                      value="Intermediate"
                    >
                      Intermediate
                    </CustomRadio>
                    <CustomRadio
                      classNames={{ base: "!max-w-full h-10" }}
                      value="Advanced"
                    >
                      Advanced
                    </CustomRadio>
                  </RadioGroup>
                </div>
              )}
              <div className="mt-auto flex w-full gap-2 *:w-full">
                <Link
                  className={button({ color: "default" })}
                  color="primary"
                  to="/"
                  type="submit"
                >
                  Back
                </Link>
                <Button color="primary" isLoading={isLoading} type="submit">
                  Create
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </RoomLayout>
    </DefaultLayout>
  );
};

export default RoomForm;
