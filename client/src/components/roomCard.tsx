import type { room } from "@/pages/rooms";

import { Link } from "react-router-dom";

function RoomCard({ room }: { room: room }) {
  return (
    <Link
      className="col-span-1 rounded-lg bg-foreground-100 p-4 shadow-2xl transition duration-400 hover:shadow-primary-100 dark:bg-default-50"
      to={`/room/${room.id}`}
    >
      <h3>{room.name}</h3>
      <small>{room.id}</small>
    </Link>
  );
}

export default RoomCard;
