import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Navbar } from "@/components/navbar";
import { RoomStore } from "@/store";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { ws } = RoomStore();

  useEffect(() => {
    if (!ws) return;
    ws.close();
  }, [location.pathname, ws]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Decorative background crosshairs */}
      <div className="crosshair-v" />
      <div className="crosshair-h" />

      <Navbar />

      <main className="relative z-10 container mx-auto flex max-w-7xl grow flex-col items-stretch justify-stretch px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="z-10 w-full py-6 text-center">
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
