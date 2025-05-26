import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import { Controller, SearchIcon } from "@/components/icons";
import RoomCard from "@/components/roomCard";
import DefaultLayout from "@/layouts/default";

export type room = {
  id: string;
  name: string;
  is_protected: boolean;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<{
    rooms: room[];
    search: room[];
    queried: boolean;
  }>({
    rooms: [],
    search: [],
    queried: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState<string>("");

  const handleFetch = () => {
    if (!search && !rooms.rooms) return;

    setIsLoading(true);

    fetch(`/api/rooms${search ? `?name=${search}` : ""}`)
      .then((response) => response.json())
      .then((data: room[]) => {
        console.log(data);
        if (search) {
          setRooms((state) => ({
            ...state,
            search: data || [],
            queried: true,
          }));
        } else {
          setRooms((state) => ({ ...state, rooms: data || [] }));
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    setIsLoading(true);

    return handleFetch();
  }, []);

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="container mx-auto flex h-full max-w-7xl flex-grow flex-col items-center justify-center">
          <Spinner />
        </div>
      </DefaultLayout>
    );
  }

  if (rooms.rooms.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <h3>There are no rooms at the moment :/</h3>
          <Link
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href="/create"
          >
            <Controller />
            Host
          </Link>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <h1 className="relative mx-auto mb-8 w-full max-w-md text-center text-xl font-semibold before:absolute before:left-16 before:top-1/2 before:h-px before:w-1/4 before:translate-y-1/2 before:bg-default-400 before:content-[''] after:absolute after:right-16 after:top-1/2 after:h-px after:w-1/4 after:translate-y-1/2 after:bg-default-400 after:content-['']">
        Rooms
      </h1>
      <div className="grid grid-flow-row grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Input
          className="col-span-1 max-w-sm place-self-center sm:col-span-2 md:col-span-3"
          endContent={
            <SearchIcon
              className="cursor-pointer self-center"
              onClick={() => handleFetch()}
            />
          }
          placeholder="Search for a room"
          size="md"
          value={search}
          variant="bordered"
          onChange={(e) => {
            setSearch(e.target.value)
            setRooms(state => ({...state, queried: false}))
          }}
          onKeyDown={(e) => e.code === "Enter" && handleFetch()}
        />
        {search && rooms.queried
          ? rooms.search.map((room) => <RoomCard key={room.id} room={room} />)
          : rooms.rooms.map((room) => <RoomCard key={room.id} room={room} />)}
      </div>
    </DefaultLayout>
  );
}
