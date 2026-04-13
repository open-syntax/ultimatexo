/* eslint-disable jsx-a11y/no-autofocus */
import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@heroui/theme";

import { Chat as ChatIcon, X, MessageCircle, Send } from "../icons";

import { Message } from "@/types/messages";
import { Marker, Player } from "@/types/player";
import { PlayerStore, RoomStore } from "@/store";
import useWindowSize from "@/hooks/useWindowSize";

interface props {
  chat: Message[];
  marker?: Marker;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [boardHeight, setBoardHeight] = useState<number | undefined>();

  useEffect(() => {
    const board = document.getElementById("board") as HTMLDivElement | null;
    if (!board) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardHeight(entry.contentRect.height);
      }
    });

    setBoardHeight(board.offsetHeight);
    observer.observe(board);

    return () => observer.disconnect();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div
      className={cn(
        "border-foreground-100/70 bg-content1/90 flex flex-col rounded-3xl border shadow-[0_18px_70px_rgba(15,23,42,0.4)]",
        className,
      )}
      style={{ height: boardHeight }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-primary" size={18} />
          <h1 className="text-foreground-900 dark:text-foreground text-sm font-bold tracking-[0.04em] uppercase">
            Chat
          </h1>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="scrollbar-hide flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-1"
      >
        {stableChat.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center opacity-50">
            <MessageCircle className="text-primary/60" size={36} />
            <p className="text-foreground-500 text-xs">No messages yet</p>
          </div>
        ) : (
          stableChat.map((message) => (
            <div
              key={message.key}
              className={`flex w-full text-pretty ${message.player.marker === marker ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] rounded-xl px-3 py-2 text-start text-sm leading-relaxed break-words whitespace-pre-wrap ${message.player.marker === "X" ? "from-primary/25 to-primary/10 bg-gradient-to-br text-blue-700 dark:text-blue-200" : message.player.marker === "O" ? "from-danger/25 to-danger/10 bg-gradient-to-br text-red-700 dark:text-red-200" : "bg-content2/60 text-foreground"}`}
              >
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>

      <form
        autoComplete="off"
        className="flex items-center gap-2 px-3 pt-2 pb-3"
        onSubmit={(e) => handleMessageSend(e)}
      >
        <textarea
          ref={textareaRef}
          className={cn(
            "border-foreground-100/40 bg-content2/40 placeholder:text-foreground-400 h-10 w-full resize-none rounded-xl border px-3 py-2 text-sm leading-relaxed text-white transition-colors outline-none",
            marker === "O"
              ? "focus:border-danger/60"
              : "focus:border-primary/60",
          )}
          name="message"
          placeholder="Type a message..."
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          isIconOnly
          className="h-10 min-w-10 shrink-0 rounded-xl"
          color={marker === "O" ? "danger" : "primary"}
          type="submit"
        >
          <Send size={18} />
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
      <DrawerContent className="left-1/2 h-full max-w-xl -translate-x-1/2 rounded-t-3xl">
        <DrawerBody className="h-full p-0">
          <ChatLayout
            chat={chat}
            className="!h-full !rounded-t-3xl !rounded-b-none border-b-0"
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
  const [boardHeight, setBoardHeight] = useState<number | undefined>();

  useEffect(() => {
    const board = document.getElementById("board") as HTMLDivElement | null;
    if (!board) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardHeight(entry.contentRect.height);
      }
    });

    setBoardHeight(board.offsetHeight);
    observer.observe(board);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        isOpen ? "w-[320px] lg:w-[340px]" : "w-0",
        "relative overflow-hidden transition-all duration-300 ease-out",
      )}
      style={{ height: boardHeight }}
    >
      <div className="relative h-full">
        <button
          className="text-foreground-400 hover:text-foreground absolute top-3 right-3 z-10 cursor-pointer rounded-lg p-1 transition-colors"
          onClick={() => onOpenChange()}
          type="button"
        >
          <X size={16} />
        </button>
        <ChatLayout
          chat={chat}
          className="!h-full"
          handleMessageSend={handleMessageSend}
          input={input}
          marker={player?.marker}
          setInput={setInput}
        />
      </div>
    </div>
  );
};

const Chat = () => {
  const { isOpen, onOpenChange } = useDisclosure();

  const { width } = useWindowSize();

  const { player } = PlayerStore();
  const { chat, sendMessage } = RoomStore();

  const [input, setInput] = useState<string>("");
  const [lastReadCount, setLastReadCount] = useState<number>(0);

  const hasUnread = chat.length > lastReadCount;

  useEffect(() => {
    if (isOpen) {
      setLastReadCount(chat.length);
    }
  }, [isOpen, chat.length]);

  const handleMessageSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const textarea = form.querySelector(
      "textarea[name=message]",
    ) as HTMLTextAreaElement | null;
    const message = textarea?.value?.trim();

    if (!message) return;

    sendMessage(message);

    setInput("");
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  return (
    <>
      <Button
        className="border-foreground-100/30 bg-content1/80 fixed right-4 bottom-20 z-[100] size-12 min-w-12 overflow-visible rounded-full border p-0 backdrop-blur-sm md:right-5 md:bottom-6"
        variant="bordered"
        onPress={() => onOpenChange()}
      >
        <ChatIcon className="text-primary" size={20} />
        {hasUnread && !isOpen && (
          <i className="bg-danger absolute -top-1 -right-1 z-10 size-4 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
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
