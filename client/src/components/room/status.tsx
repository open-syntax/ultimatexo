import { useEffect, useRef, useState } from "react";
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
  triggerClose: React.MutableRefObject<boolean>;
  closeAllModals: () => void;
}

interface GameStatusModalProps {
  boardStatus: BoardStatus | null;
  player: Player;
  rematch: (action: GameAction) => void;
  triggerClose: React.MutableRefObject<boolean>;
  closeAllModals: () => void;
}

interface RematchStatusModalProps {
  rematchStatus: GameAction | null;
  triggerClose: React.MutableRefObject<boolean>;
  closeAllModals: () => void;
}

const GameStatus = ({
  rematchStatus,
  player,
  score,
  boardStatus,
}: GameStatusProps) => {
  const { rematch } = GameStore();

  const changeAllModalsState = useRef<boolean>(false);

  const closeAllModals = () => {
    changeAllModalsState.current = !changeAllModalsState.current;
  };

  return (
    <>
      <ScoreBoard player={player} score={score} />
      <RematchModal
        closeAllModals={closeAllModals}
        rematch={rematch}
        rematchStatus={rematchStatus}
        triggerClose={changeAllModalsState}
      />
      <GameStatusModal
        boardStatus={boardStatus}
        closeAllModals={closeAllModals}
        player={player}
        rematch={rematch}
        triggerClose={changeAllModalsState}
      />
      <RematchStatusModal
        closeAllModals={closeAllModals}
        rematchStatus={rematchStatus}
        triggerClose={changeAllModalsState}
      />
    </>
  );
};

const ScoreBoard = ({ player, score }: ScoreBoardProps) => {
  return (
    <div className="max-xs:scale-50 mx-auto grid w-fit scale-75 grid-cols-3 items-center justify-center gap-5 rounded-xl border text-2xl font-semibold">
      <div className="flex w-full flex-col justify-around gap-2 px-6 py-4 text-center">
        <span className="text-4xl text-primary">{player.marker}</span>
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
  closeAllModals,
  triggerClose,
}: RematchModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (rematchStatus === GameAction.Requested) {
      setIsOpen(true);
      closeAllModals();
    }
  }, [rematchStatus]);

  useEffect(() => {
    setIsOpen(false);
  }, [triggerClose]);

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={setIsOpen}>
      <ModalContent>
        <ModalBody className="flex flex-col items-center gap-8 py-8">
          <p className="text-2xl">Opponent wants to rematch.</p>
          <div className="flex gap-4">
            <Button
              color="primary"
              onPress={() => {
                rematch(GameAction.Accepted);
                setIsOpen(false);
              }}
            >
              Accept
            </Button>
            <Button
              onPress={() => {
                rematch(GameAction.Declined);
                setIsOpen(false);
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
  closeAllModals,
  triggerClose,
}: GameStatusModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

    setIsOpen(true);
    closeAllModals();
  }, [boardStatus]);

  const handleRematch = () => {
    rematch(GameAction.Requested);
    setIsOpen(false);
  };

  useEffect(() => {
    setIsOpen(false);
  }, [triggerClose]);

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalContent>
        <ModalBody className="flex items-center gap-8 py-8">
          <p className="text-2xl">{message}</p>
          <div className="flex gap-4">
            <Button color="primary" onPress={handleRematch}>
              Rematch?
            </Button>
            <Button onPress={() => setIsOpen(false)}>Close</Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const RematchStatusModal = ({
  rematchStatus,
  closeAllModals,
  triggerClose,
}: RematchStatusModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (rematchStatus === GameAction.Accepted) {
      setIsOpen(false);

      return;
    }

    if (
      rematchStatus !== GameAction.Sent &&
      rematchStatus !== GameAction.Declined
    )
      return;

    if (rematchStatus === GameAction.Declined) {
      setTimeout(() => {
        setIsOpen(false);
      }, 5000);
    }

    closeAllModals();
    setIsOpen(true);
  }, [rematchStatus]);

  useEffect(() => {
    setIsOpen(false);
  }, [triggerClose]);

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalContent>
        <ModalBody className="flex items-center gap-8 py-8">
          <p className="text-2xl">
            {rematchStatus === GameAction.Sent
              ? "Rematch Sent..."
              : rematchStatus === GameAction.Declined && "Opponent Declined."}
          </p>
          <Button onPress={() => setIsOpen(false)}>Close</Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GameStatus;
