import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";

import DefaultLayout from "@/layouts/default";

interface Status {
  state: "loading" | "notfound" | "completed" | "error";
  message: string;
}

function Quick() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>({
    state: "loading",
    message: "Searching for rooms.",
  });
  const attempts = useRef(0);

  
  const fetchRooms = async () => {
    attempts.current++;

    const res = await fetch("/api/rooms");
    let data = (await res.json()) as { id: string; is_protected: boolean}[];

    data = data.filter((room) => !room.is_protected);

    const len = data.length;

    if (len === 0) {
      if (attempts.current < 3) {
        setStatus({
          state: "loading",
          message: `attempt num ${attempts.current}, retrying in 5 seconds...`,
        });

        setTimeout(() => fetchRooms(), 5000);
      } else {
        setStatus({
          state: "notfound",
          message: "No rooms found. Would you like to play against AI?",
        });
      }
    } else {

      // eslint-disable-next-line react-hooks/purity
      const rand = Math.floor(Math.random() * len);
      const room = data[rand];
      
      navigate(`/room/${room.id}`);
    }
  };
  
  useEffect(() => {
    fetchRooms();
  }, []);
  
  const createBotRoom = async () => {
    const res = await fetch(`/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_level: "Beginner",
        room_type: "BotRoom",
      }),
    });

    const data = (await res.json()) as { room_id: number };

    navigate(`/room/${data.room_id}`);
  };

  return (
    <DefaultLayout>
      <div className="flex h-full flex-col items-center justify-center gap-4">
        {status.state === "loading" ? (
          <>
            <Spinner />
            {status.message}
          </>
        ) : status.state === "notfound" ? (
          <>
            <p>{status.message}</p>
            <div className="flex gap-2">
              <Button color="primary" onPress={createBotRoom}>
                Yes
              </Button>
              <Button
                onPress={() => {
                  attempts.current = 0;
                  fetchRooms();
                }}
              >
                Retry
              </Button>
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
    </DefaultLayout>
  );
}

export default Quick;
