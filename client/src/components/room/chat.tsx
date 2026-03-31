/* eslint-disable jsx-a11y/no-autofocus */
import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import { Input } from "@heroui/input";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@heroui/theme";

import { Chat as ChatIcon, X, MessageCircle } from "../icons";

import { Message } from "@/types/messages";
import { marker, Player } from "@/types/player";
import { PlayerStore, RoomStore } from "@/store";
import useWindowSize from "@/hooks/useWindowSize";

interface props {
  chat: Message[];
  marker?: marker;
  className?: string;
  handleMessageSend: (e: React.FormEvent<HTMLFormElement>) => void;

  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

interface ChatProps {
  chat: Message[];
  handleMessageSend: (e: React.FormEvent<HTMLFormElement>) => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  player: Player | null;
  isOpen: boolean;
  onOpenChange: () => void;
}

const ChatLayout = ({
  className,
  chat,
  marker,
  handleMessageSend,
  input,
  setInput,
}: props) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardHeight, setBoardHeight] = useState<number | undefined>();

  useEffect(() => {
    boardRef.current = document.getElementById(
      "board",
    ) as HTMLDivElement | null;
    if (boardRef.current) {
      setBoardHeight(boardRef.current.offsetHeight);
    }
  }, []);

  const stableChat = React.useMemo(
    () =>
      chat.map((message, index) => ({
        ...message,
        key: `${message.player.marker ?? "_"}-${message.content}-${index}`,
      })),
    [chat],
  );

  useEffect(() => {
    if (chatContainerRef.current && chat.length) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div
      className={
        "border-foreground-100/70 bg-content1/85 flex flex-col gap-4 rounded-2xl border p-4 " +
        className
      }
      style={{ height: boardHeight }}
    >
      <div className="border-foreground-100/60 flex items-center justify-between border-b pb-3">
        <h1 className="text-foreground-900 dark:text-foreground text-xl font-bold">
          Match Chat
        </h1>
      </div>
      <div
        ref={chatContainerRef}
        className="flex h-full w-full scroll-m-2 flex-col gap-2.5 overflow-y-auto pr-2"
      >
        {stableChat.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-60">
            <MessageCircle className="text-foreground-400" size={32} />
            <p className="text-foreground-500 text-sm">
              No messages yet — say hello!
            </p>
          </div>
        ) : (
          stableChat.map((message) => (
            <div
              key={message.key}
              className={`flex h-fit w-full gap-2 text-pretty ${message.player.marker === marker ? "justify-end" : "justify-start"}`}
            >
              {(message.player.marker === "X" ||
                message.player.marker === "O") && (
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center self-end rounded-full px-2 text-[11px] font-black ${message.player.marker === "X" ? "bg-primary/25 text-primary-800 dark:text-primary-200" : "bg-danger/25 text-danger-800 dark:text-danger-200"}`}
                >
                  {message.player.marker}
                </span>
              )}
              <p
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-start text-sm leading-relaxed break-words ${message.player.marker === "X" ? "bg-primary/25 text-primary-800 dark:text-primary-200" : message.player.marker === "O" ? "bg-danger/25 text-danger-800 dark:text-danger-200" : "bg-content2/80 text-foreground-800 dark:text-foreground-200"}`}
              >
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>
      <form
        autoComplete="off"
        className="border-foreground-100/60 flex h-fit w-full gap-2 border-t pt-2.5"
        onSubmit={(e) => handleMessageSend(e)}
      >
        <Input
          autoFocus
          id="input"
          name="message"
          placeholder="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button color="primary" type="submit">
          Send
        </Button>
      </form>
    </div>
  );
};

const MobileChat = ({
  chat,
  handleMessageSend,
  input,
  setInput,
  player,
  isOpen,
  onOpenChange,
}: ChatProps) => {
  return (
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
            input={input}
            marker={player?.marker}
            setInput={setInput}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

const DesktopChat = ({
  chat,
  handleMessageSend,
  input,
  setInput,
  player,
  isOpen,
  onOpenChange,
}: ChatProps) => {
  const chatRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={chatRef}
      className={cn(
        isOpen ? "w-[320px] lg:w-[340px]" : "w-0",
        "relative mt-auto h-full overflow-hidden transition-all duration-300 ease-out",
      )}
    >
      <X
        className="text-foreground-500 hover:text-foreground absolute top-5 right-5 z-10 cursor-pointer transition"
        onClick={() => onOpenChange()}
      />
      <ChatLayout
        chat={chat}
        className="rounded-2xl"
        handleMessageSend={handleMessageSend}
        input={input}
        marker={player?.marker}
        setInput={setInput}
      />
    </div>
  );
};

const Chat = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { width } = useWindowSize();

  const { player } = PlayerStore();
  const { chat, sendMessage } = RoomStore();

  const [input, setInput] = useState<string>("");
  const [isRead, setIsRead] = useState<boolean>(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat.length) return;

    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (!isOpen) {
      setIsRead(false);
    }
  }, [chat, isOpen]);

  useEffect(() => {
    if (isOpen && chat.length) {
      chatEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isOpen, chat.length]);

  const handleMessageSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const message = e.currentTarget.message.value;

    if (!message) return;

    sendMessage(message);

    setInput("");
  };

  const handleOnOpen = () => {
    onOpen();
    setIsRead(true);
  };

  return (
    <>
      <Button
        className="fixed right-4 bottom-20 z-[100] size-12 min-w-12 overflow-visible rounded-full p-0 shadow-lg md:right-5 md:bottom-6"
        color="primary"
        variant="solid"
        onPress={() => handleOnOpen()}
      >
        <ChatIcon className="fill-background stroke-background" />
        {!isRead && (
          <i className="bg-danger-400 absolute -top-1 -right-1 z-10 size-4 rounded-full" />
        )}
      </Button>
      {width! >= 720 ? (
        <DesktopChat
          chat={chat}
          handleMessageSend={handleMessageSend}
          input={input}
          isOpen={isOpen}
          player={player}
          setInput={setInput}
          onOpenChange={onOpenChange}
        />
      ) : (
        <MobileChat
          chat={chat}
          handleMessageSend={handleMessageSend}
          input={input}
          isOpen={isOpen}
          player={player}
          setInput={setInput}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};

export default Chat;
