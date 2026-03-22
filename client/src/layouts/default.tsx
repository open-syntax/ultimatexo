import { Link } from "react-router-dom";
import { useEffect } from "react";

import { Navbar } from "@/components/navbar";
import { RoomStore } from "@/store";

export default function DefaultLayout({
  children,
  pageScrollable = false,
}: {
  children: React.ReactNode;
  pageScrollable?: boolean;
}) {
  useEffect(() => {
    return () => {
      const { ws } = RoomStore.getState();

      if (!ws) return;
      ws.close();
    };
  }, []);

  return (
    <div
      className={`relative flex h-dvh flex-col selection:bg-blue-500 selection:text-white ${pageScrollable ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {/* Decorative background crosshairs */}
      <div className="crosshair-v" />
      <div className="crosshair-h" />

      <Navbar />

      <main className="relative z-20 container mx-auto flex min-h-0 max-w-7xl grow flex-col items-stretch justify-stretch px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="z-10 w-full px-4 py-6 text-center sm:px-6">
        <p className="text-sm text-slate-500">
          Made by{" "}
          <Link
            className="text-blue-500 underline-offset-4 transition-colors hover:text-blue-400 hover:underline"
            title="Open Syntax Team"
            to="https://github.com/open-syntax"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Syntax
          </Link>
        </p>
      </footer>
    </div>
  );
}
