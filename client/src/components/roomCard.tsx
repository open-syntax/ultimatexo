import { Link } from "react-router-dom";

interface props {
  room: {
    id: number;
    name: string;
    player: string;
  };
}

function RoomCard({ room }: props) {
  return (
    <Link className="bg-foreground-100 dark:bg-default-50 p-4 rounded-lg transition duration-400 shadow-2xl hover:shadow-primary-100" to={`/room/${room.id}`}>
      <h3>{room.name}</h3>
      <small>{room.player}</small>
    </Link>
  );
}

export default RoomCard;
