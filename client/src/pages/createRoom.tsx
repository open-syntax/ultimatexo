import { Button } from "@heroui/button";
import { button, card, cn } from "@heroui/theme";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { RadioGroup, Radio, RadioProps } from "@heroui/radio";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "@heroui/link";

import RoomLayout from "@/layouts/room";
import DefaultLayout from "@/layouts/default";
import { Bot, Group, Network } from "@/components/icons";

const { base, header, body } = card();

type mode = "Online" | "Local" | "Bot";
type difficulty = "Beginner" | "Intermediate" | "Advanced";

const CustomRadio = ({ children, ...props }: RadioProps) => {
  return (
    <Radio
      classNames={{
        base: cn(
          "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between group",
          "flex-row-reverse max-w-[200px] cursor-pointer rounded-lg gap-4 p-4",
          "data-[selected=true]:bg-primary data-[selected=true]:text-white",
          "data-[selected=true]:shadow-[0_0_8px_1px] data-[selected=true]:shadow-primary",
          "[&>span]:data-[selected=true]:!border-white [&>span>span]:data-[selected=true]:!bg-white",
        ),
        label: "flex items-center gap-2",
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
          ? JSON.stringify({ is_public: isPublic, name, password })
          : mode === "Local"
            ? JSON.stringify({ is_public: false })
            : JSON.stringify({ is_public: false, bot_level: difficulty }),
    })
      .then((response) => response.json())
      .then((data: { room_id: number }) => {
        navgiate(`/room/${data.room_id}`);
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
          className={`${base()} ${body()} max-h-[calc(16rem+2rem)] min-w-[calc(200px+2rem)] max-w-xl px-4 py-4 max-md:max-h-[calc(20rem+2rem)]`}
        >
          <h1 className={`${header()} mx-auto !w-fit !text-center font-bold`}>
            Create Room
          </h1>
          <div className="flex h-full items-center gap-4">
            <RadioGroup
              defaultValue="Online"
              value={mode}
              onValueChange={(e) => setMode(e as mode)}
            >
              <CustomRadio value="Online">
                <Group /> Online
              </CustomRadio>
              <CustomRadio value="Local">
                <Network /> Local
              </CustomRadio>
              <CustomRadio value="Bot">
                <Bot /> Bot
              </CustomRadio>
            </RadioGroup>
            <div className="h-full w-px overflow-y-auto bg-foreground-400" />
            <Form
              className="flexc-col flex h-full w-full"
              onSubmit={(e) => handleCreate(e)}
            >
              {mode === "Online" && (
                <div className="flex h-full w-full flex-col justify-center gap-2">
                  <Input label="Room Name" name="name" size="sm" />
                  <Input
                    label="Room Password"
                    name="password"
                    size="sm"
                    type="password"
                  />
                  <label
                    className={cn(
                      "relative flex cursor-pointer justify-around gap-2 rounded-full bg-content2 p-2",
                      "before:absolute before:left-1 before:top-1 before:h-[calc(100%-8px)] before:w-[calc(50%-2px)] before:rounded-full before:bg-primary before:transition before:content-['']",
                      isPublic && "before:translate-x-[calc(100%-4px)]",
                      "*:z-10 *:select-none",
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
              {mode === "Local" && (
                <>
                  <p>Play against your friend from same the device</p>
                </>
              )}
              {mode === "Bot" && (
                <>
                  <p>Play against computer</p>
                  <RadioGroup
                    defaultValue="Beginner"
                    orientation="horizontal"
                    value={difficulty}
                    onValueChange={(e) => setDifficulty(e as difficulty)}
                  >
                    <CustomRadio value="Beginner">Beginner</CustomRadio>
                    <CustomRadio value="Intermediate">Intermediate</CustomRadio>
                    <CustomRadio value="Advanced">Advanced</CustomRadio>
                  </RadioGroup>
                </>
              )}
              <div className="mx-auto mt-auto flex gap-2">
                <Link
                  className={button({ color: "default" })}
                  color="primary"
                  href="/"
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
          {/* <Tabs
            fullWidth
            classNames={{
              panel: "h-full *:h-full *:flex *:w-full *:flex-col *:gap-4",
            }}
            selectedKey={mode}
            onSelectionChange={(key) => setMode(key as mode)}
          >
            <Tab key="Online" title="Online">
              <Form onSubmit={(e) => handleCreate(e)}>
                <Switch isSelected={isPublic} onValueChange={setIsPublic}>
                  Public
                </Switch>
                <Input label="Name" name="name" size="sm" />
                <Input
                  label="Password"
                  name="password"
                  size="sm"
                  type="password"
                />
                <Button
                  className="mt-auto w-full"
                  color="primary"
                  isLoading={isLoading}
                  type="submit"
                >
                  Create
                </Button>
              </Form>
            </Tab>
            <Tab key="Local" title="Local">
              <Form onSubmit={(e) => handleCreate(e)}>
                <p>Play against your friend from same the device</p>
                <Button
                  className="mt-auto w-full"
                  color="primary"
                  isLoading={isLoading}
                  type="submit"
                >
                  Create
                </Button>
              </Form>
            </Tab>
            <Tab key="Bot" title="Bot">
              <Form onSubmit={(e) => handleCreate(e)}>
                Bot difficulty
                <RadioGroup
                  className="flex flex-col gap-2"
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(value as difficulty)}
                >
                  <Radio value="Beginner">Beginner</Radio>
                  <Radio value="Intermediate">Intermediate</Radio>
                  <Radio value="Advanced">Advanced</Radio>
                </RadioGroup>
                <Button
                  className="mt-auto w-full"
                  color="primary"
                  isLoading={isLoading}
                  type="submit"
                >
                  Create
                </Button>
              </Form>
            </Tab>
          </Tabs> */}
        </div>
      </RoomLayout>
    </DefaultLayout>
  );
};

export default RoomForm;
