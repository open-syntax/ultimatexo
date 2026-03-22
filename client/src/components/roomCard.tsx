import type { room } from "@/pages/rooms";

import { useState } from "react";
import { Link } from "react-router-dom";

import { Lock } from "./icons";

function RoomCard({ room }: { room: room }) {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Link
      className="group border-foreground-100/70 bg-content1/85 hover:border-primary/45 hover:bg-content1 col-span-1 rounded-2xl border p-5 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      to={`/room/${room.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-foreground-900 dark:text-foreground text-lg leading-tight font-bold">
            {room.name}
          </h3>
          <p className="text-foreground-500 text-xs tracking-[0.08em] uppercase">
            Room ID
          </p>
          <p className="text-foreground-700 dark:text-foreground-300 bg-content2/70 rounded-md px-2 py-1 font-mono text-xs tracking-wide">
            {room.id}
          </p>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${room.is_protected ? "border-warning/40 bg-warning/10 text-warning" : "border-success/40 bg-success/10 text-success"}`}
        >
          {room.is_protected ? "Protected" : "Public"}
        </span>
      </div>

      <div className="border-foreground-100/60 mt-4 flex items-center justify-between border-t pt-3">
        <div className="text-foreground-600 group-hover:text-foreground-900 dark:group-hover:text-foreground flex items-center gap-2 text-sm font-semibold transition">
          Join Room
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          >
            →
          </span>
        </div>

        <div className="flex items-center gap-2">
          {room.is_protected && (
            <Lock
              className="text-warning"
              size={16}
              aria-label="Protected room"
            />
          )}
          <button
            className="border-foreground-100 text-foreground-700 hover:border-primary/35 hover:bg-primary/10 dark:text-foreground-300 rounded-md border px-2 py-1 text-xs font-semibold transition"
            type="button"
            onClick={handleCopyRoomId}
          >
            {copied ? "Copied" : "Copy ID"}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default RoomCard;
