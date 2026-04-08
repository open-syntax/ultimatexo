import { Input } from "@heroui/input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { Link, useSearchParams } from "react-router-dom";
import { button as buttonStyles } from "@heroui/theme";
import { motion, useReducedMotion } from "framer-motion";

import { Controller, SearchIcon } from "@/components/icons";
import RoomCard from "@/components/roomCard";
import DefaultLayout from "@/layouts/default";
import { Footer } from "@/components/footer";
import { usePageMeta } from "@/hooks/usePageMeta";

export type room = {
  id: string;
  name: string;
  is_protected: boolean;
};

const AUTO_REFRESH_MS = 15000;

export default function RoomsPage() {
  usePageMeta({
    title: "Find a Game Room",
    description:
      "Browse active Ultimate Tic-Tac-Toe rooms, filter by privacy, and jump straight into a live multiplayer game.",
    path: "/rooms",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(() => searchParams.get("q") ?? "");
  const [protectedOnly, setProtectedOnly] = useState<boolean>(
    () => searchParams.get("protected") === "1",
  );
  const [allRooms, setAllRooms] = useState<room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const fetchRooms = useCallback(
    async (
      name: string,
      options?: { silent?: boolean; signal?: AbortSignal },
    ) => {
      const searchName = name.trim();
      const silent = options?.silent ?? false;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();

        if (searchName) {
          params.set("name", searchName);
        }

        const endpoint = params.size ? `/api/rooms?${params}` : "/api/rooms";
        const response = await fetch(endpoint, { signal: options?.signal });

        if (!response.ok) {
          throw new Error("Could not load rooms. Please try again.");
        }

        const data = (await response.json()) as room[];

        setAllRooms(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(Date.now());
      } catch {
        if (options?.signal?.aborted) return;
        setError("Unable to fetch rooms right now.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (protectedOnly) {
      params.set("protected", "1");
    }

    setSearchParams(params, { replace: true });
  }, [query, protectedOnly, setSearchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchRooms(query);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [fetchRooms, query]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchRooms(query, { silent: true });
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchRooms, query]);

  const rooms = useMemo(
    () =>
      protectedOnly
        ? allRooms.filter((roomData) => roomData.is_protected)
        : allRooms,
    [allRooms, protectedOnly],
  );

  const isFiltering = Boolean(query.trim()) || protectedOnly;
  const roomCountLabel = `${rooms.length} room${rooms.length === 1 ? "" : "s"}`;
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <DefaultLayout>
      <div className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-12">
          <section className="border-foreground-100/70 bg-content1/85 relative overflow-hidden rounded-2xl border p-5 shadow-lg md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_58%)]" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
                  Matchmaking Lobby
                </p>
                <h1 className="text-foreground-900 dark:text-foreground text-3xl font-black tracking-tight md:text-4xl">
                  Find a Room
                </h1>
                <p className="text-foreground-700 dark:text-foreground-300 max-w-2xl text-sm leading-relaxed md:text-base">
                  Browse active rooms, filter by privacy, and jump straight into
                  a live game.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="border-foreground-100/70 bg-content2/70 rounded-full border px-3 py-1 text-xs font-semibold">
                  {roomCountLabel}
                </span>
                <span className="border-foreground-100/70 bg-content2/70 rounded-full border px-3 py-1 text-xs font-semibold">
                  Updated {lastUpdatedLabel}
                </span>
                <Link
                  className={buttonStyles({ color: "primary", radius: "md" })}
                  to="/create"
                >
                  <Controller size={18} />
                  Host Room
                </Link>
              </div>
            </div>
          </section>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="border-foreground-100/70 bg-content1/80 space-y-4 rounded-2xl border p-5 md:p-6"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.18,
              ease: "easeOut",
              delay: prefersReducedMotion ? 0 : 0.03,
            }}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <Input
                endContent={<SearchIcon className="text-foreground-500" />}
                placeholder="Search by room name"
                size="lg"
                value={query}
                variant="bordered"
                onChange={(event) => setQuery(event.target.value)}
              />

              <button
                className={`h-11 rounded-lg border px-4 text-sm font-semibold transition ${protectedOnly ? "border-primary/60 bg-primary/15 text-foreground-900 dark:text-foreground" : "border-foreground-100 bg-content2/70 text-foreground-700 hover:border-primary/35 hover:bg-primary/10 dark:text-foreground-300"}`}
                type="button"
                onClick={() => setProtectedOnly((current) => !current)}
              >
                {protectedOnly ? "Protected only" : "All rooms"}
              </button>

              <button
                className="border-foreground-100 bg-content2/70 text-foreground-700 hover:border-primary/35 hover:bg-primary/10 dark:text-foreground-300 h-11 rounded-lg border px-4 text-sm font-semibold transition"
                disabled={isRefreshing}
                type="button"
                onClick={() => fetchRooms(query, { silent: true })}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-foreground-600 dark:text-foreground-400">
                {isFiltering
                  ? `Showing ${roomCountLabel} for current filters.`
                  : `Showing ${roomCountLabel} currently available.`}
              </p>
              {query && (
                <button
                  className="text-primary text-sm font-semibold hover:underline"
                  type="button"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>
              )}
            </div>
          </motion.section>

          {error && (
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="border-danger/40 bg-danger/10 rounded-2xl border p-5 md:p-6"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.16,
                ease: "easeOut",
              }}
            >
              <p className="text-danger text-sm font-semibold">{error}</p>
              <button
                className="bg-danger mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                type="button"
                onClick={() => fetchRooms(query)}
              >
                Retry
              </button>
            </motion.section>
          )}

          {!error && isLoading ? (
            <motion.section
              animate={{ opacity: 1 }}
              className="border-foreground-100/70 bg-content1/80 flex min-h-48 items-center justify-center rounded-2xl border"
              initial={{ opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.14,
                ease: "easeOut",
              }}
            >
              <Spinner label="Loading rooms..." />
            </motion.section>
          ) : rooms.length === 0 ? (
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="border-foreground-100/70 bg-content1/80 rounded-2xl border p-7 text-center md:p-8"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.16,
                ease: "easeOut",
              }}
            >
              <h2 className="text-foreground-900 dark:text-foreground text-2xl font-bold">
                {isFiltering ? "No matching rooms" : "No rooms yet"}
              </h2>
              <p className="text-foreground-700 dark:text-foreground-300 mx-auto mt-2 max-w-xl text-sm leading-relaxed">
                {isFiltering
                  ? "Try removing filters or create your own room to get a match started."
                  : "Be the first to start a lobby and invite other players."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {isFiltering && (
                  <button
                    className={buttonStyles({ variant: "flat" })}
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setProtectedOnly(false);
                    }}
                  >
                    Reset Filters
                  </button>
                )}
                <Link
                  className={buttonStyles({ color: "primary", radius: "md" })}
                  to="/create"
                >
                  <Controller size={18} />
                  Create Room
                </Link>
              </div>
            </motion.section>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rooms.map((roomData, index) => (
                <motion.div
                  key={roomData.id}
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.16,
                    ease: "easeOut" as const,
                    delay: prefersReducedMotion
                      ? 0
                      : Math.min(index * 0.02, 0.16),
                  }}
                >
                  <RoomCard room={roomData} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </DefaultLayout>
  );
}
