import { Link } from "@heroui/link";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Navbar } from "@/components/navbar";
import PlayerStore from "@/store/player";


export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { ws } = PlayerStore();

  useEffect(() => {
    if (!ws) return;
    ws.close();
  }, [location.pathname]);

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-grow items-center justify-center px-6 py-8">
        {children}
      </main>
      <footer className="flex w-full items-center justify-center py-3">
        <span className="text-default-600">
          Made by{" "}
          <Link
            isExternal
            className="text-primary"
            href="https://github.com/OmarIsADev"
            title="Omar's Github"
          >
            Omar
          </Link>{" "}
          &{" "}
          <Link
            isExternal
            className="text-primary"
            href="https://github.com/ahmed-mekky"
            title="Mekky's Github"
          >
            Mekky
          </Link>
        </span>
      </footer>
    </div>
  );
}
