import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import { Input } from "@heroui/input";
import { useEffect, useState } from "react";

import { Chat as ChatIcon } from "./icons";

import PlayerStore from "@/store/player";
import { socketEvent } from "@/types";
import { Message } from "@/types/messages";
import { marker } from "@/types/player";
import useWindowSize from "@/hooks/useWindowSize";

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
      <div className="flex h-full w-full flex-col gap-2 overflow-y-scroll pr-2">
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
    ws,
    player: {
      id,
      info: { marker },
    },
  } = PlayerStore();

  const { width } = useWindowSize();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isRead, setIsRead] = useState<boolean>(true);
  const [chat, setChat] = useState<Message[]>([]);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (e) => {
      const event: socketEvent = JSON.parse(e.data);

      if (event.event !== "TextMessage") return;

      setChat((prev) => [...prev, event.data]);
    };
  }, [ws]);

  useEffect(() => {
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

    ws?.send(
      JSON.stringify({
        TextMessage: {
          content: message,
          player_id: id,
        },
      }),
    );

    e.currentTarget.reset();
  };

  const handleOnOpen = () => {
    onOpen();
    setIsRead(true);
  };

  if (width && width < 768) {
    return (
      <>
        <Button
          className="fixed bottom-4 right-4 size-12 min-w-12 rounded-full p-0 z-[5] overflow-visible"
          variant="bordered"
          onPress={() => handleOnOpen()}
        >
          <ChatIcon />
          {!isRead && (
            <i className="absolute -right-1 -top-1 size-4 z-10 rounded-full bg-danger-400" />
          )}
        </Button>
        <Drawer isOpen={isOpen} placement="bottom" size="xl" onOpenChange={onOpenChange}>
          <DrawerContent className="h-full">
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
  }

  return (
    <ChatLayout
      chat={chat}
      handleMessageSend={handleMessageSend}
      marker={marker}
    />
  );
};

export default Chat;
