import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useEffect, useState } from "react";

import PlayerStore from "@/store/player";
import { socketEvent } from "@/types";
import { Message } from "@/types/messages";

const Chat = () => {
  const {
    ws,
    player: {
      id,
      info: { marker },
    },
  } = PlayerStore();

  const [chat, setChat] = useState<Message[]>([]);

  useEffect(() => {
    console.log("socket")
    if (!ws) return;
    console.log("socket connected")

    ws.onmessage = (e) => {
      const event: socketEvent = JSON.parse(e.data);

      if (event.event !== "TextMessage") return;

      setChat((prev) => [...prev, event.data]);
    };
  }, [ws]);

  useEffect(() => {
    const element = document.getElementById(`message-${chat.length - 1}`);

    element?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div
      className="flex flex-col gap-4 rounded-3xl bg-default-50 p-4"
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

export default Chat;
