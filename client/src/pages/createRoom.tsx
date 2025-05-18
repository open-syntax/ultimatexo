import { Button } from "@heroui/button";
import { card } from "@heroui/theme";
import { Form } from "@Heroui/form";
import { Tab, Tabs } from "@Heroui/tabs";
import { Input } from "@heroui/input";
import { RadioGroup, Radio } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import RoomLayout from "@/layouts/room";
import DefaultLayout from "@/layouts/default";

const { base, header, body, footer } = card();

type mode = "Online" | "Local" | "Bot";
type difficulty = "Easy" | "Medium" | "Hard";

const RoomForm = () => {
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<mode>("Online");
  const [difficulty, setDifficulty] = useState<difficulty>("Easy");
  const navgiate = useNavigate();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    const data = new FormData(e.currentTarget);
    const password = (data.get("password") as string) || "";

    fetch(`/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: !isPublic
        ? JSON.stringify({ is_public: isPublic, password })
        : JSON.stringify({ is_public: isPublic }),
    })
      .then((response) => response.json())
      .then((data) => {
        navgiate(`/room/${data}${isPublic ? "" : `:${password}`}`);
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
          className={`${base()} ${body()} max-h-[22rem] min-w-72 max-w-96 px-4 py-2 *:*:h-full`}
        >
          <h1 className={`${header()} mx-auto !w-fit !text-center`}>
            Create Room
          </h1>
          <Tabs
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
                <Input
                  isDisabled={isPublic}
                  isRequired={!isPublic}
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
                  <Radio value="Easy">Easy</Radio>
                  <Radio value="Medium">Medium</Radio>
                  <Radio value="Hard">Hard</Radio>
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
          </Tabs>
        </div>
      </RoomLayout>
    </DefaultLayout>
  );
};

export default RoomForm;
