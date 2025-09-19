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
  }, [location.pathname]);

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <Navbar />
      <main className="container mx-auto flex max-w-7xl flex-grow flex-col items-stretch justify-stretch px-6 py-8">
        {children}
      </main>
      <footer className="flex w-full items-center justify-center py-3">
        <span className="text-default-600">
          Made by{" "}
          <Link
            className="text-danger"
            title="Out Of Syntax Team."
            to="https://github.com/OutOfSyntax"
          >
            Out Of Syntax Team.
          </Link>
        </span>
      </footer>
    </div>
  );
}
