import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import { Input } from "@heroui/input";
import { useEffect, useState } from "react";

import { Chat as ChatIcon } from "../icons";

import { Message } from "@/types/messages";
import { marker } from "@/types/player";
import useWindowSize from "@/hooks/useWindowSize";
import { PlayerStore, RoomStore } from "@/store";

interface props {
  chat: Message[];
  marker: marker;
  className?: string;
  handleMessageSend: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ChatLayout = ({ className, chat, marker, handleMessageSend }: props) => {
  return (
    <div
      className={
        "flex flex-col gap-4 rounded-3xl bg-default-50 p-4 " + className
      }
      style={{ height: document.getElementById("board")?.offsetHeight }}
    >
      <h1 className="text-center text-2xl font-bold">Chat</h1>
      <div className="flex h-full w-full flex-col gap-2 overflow-y-auto pr-2">
        {chat.map((message, i) => (
          <div
            key={i}
            className={`flex h-fit w-full gap-2 text-pretty ${message.player.marker === marker ? "justify-end" : "justify-start"}`}
            id={`message-${i}`}
          >
            <p
              className={`max-w-[80%] rounded-3xl px-4 py-2 text-start ${message.player.marker === marker ? "bg-primary" : "bg-default-200"}`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <form
        className="flex h-fit w-full gap-2"
        onSubmit={(e) => handleMessageSend(e)}
      >
        <Input name="message" placeholder="Message" />
        <Button color="primary" type="submit">
          Send
        </Button>
      </form>
    </div>
  );
};

const Chat = () => {
  const {
    player: {
      info: { marker },
    },
  } = PlayerStore();
  const { chat, sendMessage } = RoomStore();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isRead, setIsRead] = useState<boolean>(true);

  useEffect(() => {
    if (!chat.length) return;
    const element = document.getElementById(`message-${chat.length - 1}`);

    element?.scrollIntoView({ behavior: "smooth" });

    if (!isOpen) {
      setIsRead(false);
    }
  }, [chat]);

  const handleMessageSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const message = e.currentTarget.message.value;

    if (!message) return;

    sendMessage(message);

    e.currentTarget.reset();
  };

  const handleOnOpen = () => {
    onOpen();
    setIsRead(true);
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 z-[5] size-12 min-w-12 overflow-visible rounded-full p-0"
        color="primary"
        variant="solid"
        onPress={() => handleOnOpen()}
      >
        <ChatIcon className="fill-background stroke-background" />
        {!isRead && (
          <i className="absolute -right-1 -top-1 z-10 size-4 rounded-full bg-danger-400" />
        )}
      </Button>
      <Drawer
        backdrop="transparent"
        isOpen={isOpen}
        placement="bottom"
        size="xl"
        onOpenChange={onOpenChange}
      >
        <DrawerContent className="left-1/2 h-full max-w-xl -translate-x-1/2">
          <DrawerBody className="h-full">
            <ChatLayout
              chat={chat}
              className="!h-full"
              handleMessageSend={handleMessageSend}
              marker={marker}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );

  // return (
  //   <ChatLayout
  //     chat={chat}
  //     handleMessageSend={handleMessageSend}
  //     marker={marker}
  //   />
  // );
};

export default Chat;
