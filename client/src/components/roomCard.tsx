import type { room } from "@/pages/rooms";

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { Lock, Check, Copy } from "./icons";

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
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Link
      className="group border-foreground-100/70 bg-content1/85 hover:border-primary/45 relative block overflow-hidden rounded-2xl border shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      to={`/room/${room.id}`}
    >
      <div className="from-primary/0 to-primary/0 group-hover:from-primary/5 absolute inset-0 bg-gradient-to-br transition-all duration-300 group-hover:to-transparent" />

      <div className="relative flex items-start justify-between gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-foreground-900 dark:text-foreground text-lg leading-tight font-bold">
            {room.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-foreground-400 text-xs font-medium tracking-wider uppercase">
              ID
            </span>
            <span className="bg-content2/70 text-foreground-700 dark:text-foreground-300 rounded-md px-2 py-0.5 font-mono text-xs tracking-wide">
              {room.id}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${room.is_protected ? "border-warning/40 bg-warning/10 text-warning" : "border-success/40 bg-success/10 text-success"}`}
        >
          {room.is_protected ? "Protected" : "Public"}
        </span>
      </div>

      <div className="relative mx-5">
        <div className="bg-foreground-100/60 group-hover:bg-primary/20 h-px transition-colors duration-300" />
      </div>

      <div className="relative flex items-center justify-between px-5 py-3">
        <div className="text-foreground-500 group-hover:text-primary flex items-center gap-2 text-sm font-semibold transition-colors duration-300">
          Click to join
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </div>

        <div className="flex items-center gap-2">
          {room.is_protected && (
            <Lock
              aria-label="Protected room"
              className="text-warning"
              size={16}
            />
          )}
          <button
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              copied
                ? "border-success/40 bg-success/10 text-success"
                : "border-foreground-100/70 text-foreground-500 hover:border-primary/35 hover:bg-primary/10 hover:text-foreground-700 dark:text-foreground-400 dark:hover:text-foreground-300"
            }`}
            type="button"
            onClick={handleCopyRoomId}
          >
            {copied ? (
              <motion.span
                animate={{ scale: [0.8, 1.1, 1] }}
                className="flex items-center gap-1.5"
                transition={{ duration: 0.3 }}
              >
                <Check size={12} />
                Copied
              </motion.span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Copy size={12} />
                Copy ID
              </span>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default RoomCard;
