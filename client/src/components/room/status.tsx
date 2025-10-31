import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";

import { BoardStatus } from "@/types";
import { GameAction } from "@/types/actions";
import { GameStore } from "@/store";
import { Player } from "@/types/player";

interface GameStatusProps {
  boardStatus: BoardStatus | null;
  rematchStatus: GameAction | null;
  player: Player;
  drawStatus: GameAction | null;
  score: [number, number];
}

interface ScoreBoardProps {
  score: [number, number];
  player: Player;
}

interface RematchModalProps {
  rematchStatus: GameAction | null;
  rematch: (action: GameAction) => void;
  openModal: string;
  setOpenModal: React.Dispatch<React.SetStateAction<string>>;
}

interface GameStatusModalProps {
  boardStatus: BoardStatus | null;
  player: Player;
  rematch: (action: GameAction) => void;
  openModal: string;
  setOpenModal: React.Dispatch<React.SetStateAction<string>>;
}

interface RematchStatusModalProps {
  rematchStatus: GameAction | null;
  openModal: string;
  setOpenModal: React.Dispatch<React.SetStateAction<string>>;
}

const GameStatus = ({
  rematchStatus,
  player,
  score,
  boardStatus,
}: GameStatusProps) => {
  const { rematch } = GameStore();

  const [currentOpenModal, setCurrentOpenModal] = useState<string>("");

  return (
    <>
      <ScoreBoard player={player} score={score} />
      <RematchModal
        openModal={currentOpenModal}
        rematch={rematch}
        rematchStatus={rematchStatus}
        setOpenModal={setCurrentOpenModal}
      />
      <GameStatusModal
        boardStatus={boardStatus}
        openModal={currentOpenModal}
        player={player}
        rematch={rematch}
        setOpenModal={setCurrentOpenModal}
      />
      <RematchStatusModal
        openModal={currentOpenModal}
        rematchStatus={rematchStatus}
        setOpenModal={setCurrentOpenModal}
      />
    </>
  );
};

const ScoreBoard = ({ player, score }: ScoreBoardProps) => {
  return (
    <div className="max-xs:scale-50 mx-auto grid w-fit scale-75 grid-cols-3 items-center justify-center gap-5 rounded-xl border text-2xl font-semibold">
      <div className="flex w-full flex-col justify-around gap-2 px-6 py-4 text-center">
        <span className="text-primary text-4xl">{player.marker}</span>
        <div className="h-px w-full bg-white" />
        You
      </div>
      <div className="w-full border-x-1 text-center text-4xl">
        {score[player.marker === "X" ? 0 : 1]} :{" "}
        {score[player.marker === "X" ? 1 : 0]}
      </div>
      <div className="flex w-full flex-col justify-around gap-2 px-6 py-4 text-center">
        <span className="text-4xl">{player.marker === "X" ? "O" : "X"}</span>
        <div className="h-px w-full bg-white" />
        Opp
      </div>
    </div>
  );
};

const RematchModal = ({
  rematchStatus,
  rematch,
  openModal,
  setOpenModal,
}: RematchModalProps) => {
  useEffect(() => {
    if (rematchStatus === GameAction.Requested) {
      setOpenModal("rematchModal");
    }
  }, [rematchStatus]);

  return (
    <Modal
      isOpen={openModal === "rematchModal"}
      placement="center"
      onClose={() => setOpenModal("")}
    >
      <ModalContent>
        <ModalBody className="flex flex-col items-center gap-8 py-8">
          <p className="text-2xl">Opponent wants to rematch.</p>
          <div className="flex gap-4">
            <Button
              color="primary"
              onPress={() => {
                rematch(GameAction.Accepted);
                setOpenModal("");
              }}
            >
              Accept
            </Button>
            <Button
              onPress={() => {
                rematch(GameAction.Declined);
                setOpenModal("");
              }}
            >
              Decline
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const GameStatusModal = ({
  boardStatus,
  player,
  rematch,
  openModal,
  setOpenModal,
}: GameStatusModalProps) => {
  const message =
    boardStatus === BoardStatus.Draw
      ? "Draw"
      : player.marker === boardStatus
        ? "You won!"
        : "Opponent won!";

  useEffect(() => {
    if (
      [null, BoardStatus.Paused, BoardStatus.WaitingForPlayers].includes(
        boardStatus,
      )
    )
      return;

    setOpenModal("gameStatusModal");
  }, [boardStatus]);

  const handleRematch = () => {
    rematch(GameAction.Requested);
    setOpenModal("rematchStatusModal");
  };

  return (
    <Modal
      isOpen={openModal === "gameStatusModal"}
      placement="center"
      onClose={() => setOpenModal("")}
    >
      <ModalContent>
        <ModalBody className="flex items-center gap-8 py-8">
          <p className="text-2xl">{message}</p>
          <div className="flex gap-4">
            <Button color="primary" onPress={handleRematch}>
              Rematch?
            </Button>
            <Button onPress={() => setOpenModal("")}>Close</Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const RematchStatusModal = ({
  rematchStatus,
  openModal,
  setOpenModal,
}: RematchStatusModalProps) => {
  useEffect(() => {
    if (rematchStatus === GameAction.Accepted) {
      setOpenModal("");

      return;
    }

    if (
      rematchStatus !== GameAction.Sent &&
      rematchStatus !== GameAction.Declined
    )
      return;

    if (rematchStatus === GameAction.Declined) {
      setTimeout(() => {
        setOpenModal("");
      }, 5000);
    }

    setOpenModal("rematchStatusModal");
  }, [rematchStatus]);

  return (
    <Modal
      isOpen={openModal === "rematchStatusModal"}
      placement="center"
      onClose={() => setOpenModal("")}
    >
      <ModalContent>
        <ModalBody className="flex items-center gap-8 py-8">
          <p className="text-2xl">
            {rematchStatus === GameAction.Sent
              ? "Rematch Sent..."
              : rematchStatus === GameAction.Declined && "Opponent Declined."}
          </p>
          <Button onPress={() => setOpenModal("")}>Close</Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GameStatus;
