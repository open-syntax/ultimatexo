import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";

import { SearchIcon } from "@/components/icons";
import RoomCard from "@/components/roomCard";
import DefaultLayout from "@/layouts/default";

export type room = {
  id: string;
  name: string;
  isProtected: boolean;
};

const roomstest = [
  {
    id: "1",
    name: "Room 1",
    isProtected: false,
  },
  {
    id: "12",
    name: "Room 2",
    isProtected: false,
  },
  {
    id: "13",
    name: "Room 3",
    isProtected: true,
  },
];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<room[]>(roomstest);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = (name?: string) => {
    setIsLoading(true);

    fetch(`/api/rooms${name ? `?name=${name}` : ""}`)
      .then((response) => response.json())
      .then((data: room[]) => {
        // setRooms(data);
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
              onClick={() => handleFetch}
            />
          }
          placeholder="Search for a room"
          size="md"
          variant="bordered"
        />
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </DefaultLayout>
  );
}
