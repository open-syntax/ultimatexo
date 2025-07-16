import { Button } from "@heroui/button";
import { useEffect, useState } from "react";

import PlayerStore from "@/store/player";
import { BoardStatus, socketEvent } from "@/types";
import { RestartActions } from "@/types/actions";

interface props {
  boardStatus: BoardStatus;
}

const GameStatus = ({ boardStatus }: props) => {
  const { nextPlayer, ws } = PlayerStore();

  const [restartRequest, setRestartRequest] = useState<boolean>(false);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (e) => {
      const event: socketEvent = JSON.parse(e.data);

      if (event.event !== "GameRestart") return;

      if (event.data.action === RestartActions.Requested) {
        setRestartRequest(true);
      }
    };
  }, [ws]);

  const handleRematch = (action: RestartActions) => {
    ws?.send(
      JSON.stringify({
        GameRestart: {
          action,
        },
      }),
    );
  };

  if (restartRequest)
    return (
      <div className="flex animate-appearance-in gap-2">
        <Button
          color="primary"
          onPress={() => handleRematch(RestartActions.Accepted)}
        >
          Accept
        </Button>
        <Button
          color="default"
          onPress={() => handleRematch(RestartActions.Rejected)}
        >
          Reject
        </Button>
      </div>
    );

  switch (boardStatus) {
    case BoardStatus.Paused:
      return <p>Game Paused.</p>;
    case BoardStatus.X:
      return (
        <Rematch
          player="X"
          onClick={() => handleRematch(RestartActions.Requested)}
        />
      );
    case BoardStatus.O:
      return (
        <Rematch
          player="O"
          onClick={() => handleRematch(RestartActions.Requested)}
        />
      );
    case BoardStatus.Draw:
      return <p>Draw.</p>;
  }

  return <p>{nextPlayer}&apos;s Turn.</p>;
};

const Rematch = ({
  player,
  onClick,
}: {
  player: "X" | "O" | "Draw";
  onClick?: () => void;
}) => {
  return (
    <>
      <p>{player === "Draw" ? "Draw!" : `Player ${player} Won!`}</p>
      <Button
        className="w-fit animate-appearance-in"
        color="primary"
        onPress={onClick}
      >
        Rematch?
      </Button>
    </>
  );
};

export default GameStatus;
