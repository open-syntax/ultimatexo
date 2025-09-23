import { useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";

import { BoardStatus } from "@/types";
import { RestartActions } from "@/types/actions";
import { GameStore } from "@/store";
import { Player } from "@/types/player";

interface props {
  boardStatus: BoardStatus;
  rematchStatus: RestartActions | null;
  player: Player;
}

const GameStatus = ({ boardStatus, rematchStatus, player }: props) => {
  const { nextPlayer } = GameStore();

  return (
    <>
      <div className="flex w-full justify-center gap-5 text-2xl font-semibold">
        <div className="w-full text-end">
          {player.marker === "X" ? "You" : "Opp"}
          <span
            className={player.marker === "X" ? "ml-2 text-primary" : "ml-2"}
          >
            X
          </span>
        </div>
        <div>:</div>
        <div className="w-full text-start">
          <span
            className={player.marker === "O" ? "mr-2 text-primary" : "mr-2"}
          >
            O
          </span>
          {player.marker === "O" ? "You" : "Opp"}
        </div>
      </div>
      <Status boardStatus={boardStatus} rematchStatus={rematchStatus} />

      <Modal
        isOpen={rematchStatus === RestartActions.Requested}
        placement="center"
      >
        <ModalContent className="w-fit">
          <ModalBody className="w-fit">
            <div className="flex flex-col items-center gap-4 px-8 py-4">
              <p>Opponent wants to rematch.</p>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  onPress={() => GameStore().rematch(RestartActions.Accepted)}
                >
                  Accept
                </Button>
                <Button
                  onPress={() => GameStore().rematch(RestartActions.Declined)}
                >
                  Decline
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const Status = ({ rematchStatus, boardStatus }: Omit<props, "player">) => {
  const { rematch, resign } = GameStore();

  const [resignConfirm, setResignConfirm] = useState(false);

  if (rematchStatus === RestartActions.Sent)
    return <div>Waiting for Opponent...</div>;

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
    default:
      return resignConfirm ? (
        <div className="flex flex-col items-center gap-2">
          <p>Are you sure you want to resign?</p>
          <div className="flex gap-2">
            <Button
              color="primary"
              onPress={() => {
                resign();
                setResignConfirm(false);
              }}
            >
              Yes
            </Button>
            <Button onPress={() => setResignConfirm(false)}>No</Button>
          </div>
        </div>
      ) : (
        <Button onPress={() => setResignConfirm(true)}>Resign</Button>
      );
  }
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
