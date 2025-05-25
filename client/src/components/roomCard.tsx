import type { room } from "@/pages/rooms";

import { Link } from "react-router-dom";

import { Lock } from "./icons";

function RoomCard({ room }: { room: room }) {
  return (
    <Link
      className="col-span-1 rounded-lg bg-foreground-100 p-4 shadow-2xl transition duration-400 hover:shadow-primary-100 dark:bg-default-50"
      to={`/room/${room.id}`}
    >
      <div className="flex justify-between">
        <h3>{room.name}</h3>
        {room.is_protected && <Lock color="white" />}
      </div>
      <small>{room.id}</small>
    </Link>
  );
}

export default RoomCard;
