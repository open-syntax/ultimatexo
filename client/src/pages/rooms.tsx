import RoomCard from "@/components/roomCard";
import DefaultLayout from "@/layouts/default";

const rooms = [
  {
    id: 1,
    name: "Room 1",
    player: "joe",
  },
  {
    id: 2,
    name: "Room 2",
    player: "dew",
  },
  {
    id: 3,
    name: "Room 3",
    player: "blayt",
  },
];

export default function RoomsPage() {
  return (
    <DefaultLayout>
      <h1 className="relative mx-auto mb-8 w-full max-w-md text-center text-xl font-semibold before:absolute before:left-16 before:top-1/2 before:h-px before:w-1/4 before:translate-y-1/2 before:bg-default-400 before:content-[''] after:absolute after:right-16 after:top-1/2 after:h-px after:w-1/4 after:translate-y-1/2 after:bg-default-400 after:content-['']">
        Rooms
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </DefaultLayout>
  );
}
