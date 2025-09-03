import { Button } from "@heroui/button";

import { BoardStatus } from "@/types";
import { RestartActions } from "@/types/actions";
import { GameStore } from "@/store";

interface props {
  boardStatus: BoardStatus;
  rematchStatus: RestartActions | null;
}

const GameStatus = ({ boardStatus, rematchStatus }: props) => {
  const { nextPlayer, rematch, resign } = GameStore();

  if (rematchStatus === RestartActions.Requested)
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-center">Opponent Requested Rematch</p>
        <div className="flex animate-appearance-in gap-2">
          <Button
            color="primary"
            onPress={() => rematch(RestartActions.Accepted)}
          >
            Accept
          </Button>
          <Button
            color="default"
            onPress={() => rematch(RestartActions.Declined)}
          >
            Decline
          </Button>
        </div>
      </div>
    );
    else if (rematchStatus === RestartActions.Sent) return <div>Waiting for Opponent...</div>

  switch (boardStatus) {
    case BoardStatus.Paused:
      return <p>Game Paused.</p>;
    case BoardStatus.X:
      return (
        <Rematch player="X" onClick={() => rematch(RestartActions.Requested)} />
      );
    case BoardStatus.O:
      return (
        <Rematch player="O" onClick={() => rematch(RestartActions.Requested)} />
      );
    case BoardStatus.Draw:
      return <p>Draw.</p>;
  }

  return (
    <>
      <p>{nextPlayer}&apos;s Turn.</p>
      <Button onPress={() => resign()}>Resign</Button>
    </>
  );
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
