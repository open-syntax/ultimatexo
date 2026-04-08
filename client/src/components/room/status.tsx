import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import { cn } from "@heroui/theme";

import { BoardStatus } from "@/types";
import { GameAction } from "@/types/actions";
import { GameStore, RoomStore } from "@/store";
import { Player } from "@/types/player";

interface GameStatusProps {
  boardStatus: BoardStatus | null;
  rematchStatus: GameAction | null;
  player: Player;
  drawStatus: GameAction | null;
  score: [number, number];
  playerNames?: {
    player1?: string;
    player2?: string;
  };
}

interface ScoreBoardProps {
  score: [number, number];
  player: Player;
  playerNames?: {
    player1?: string;
    player2?: string;
  };
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
  playerNames,
}: GameStatusProps) => {
  const { rematch } = GameStore();
  const { ws } = RoomStore();

  const [currentOpenModal, setCurrentOpenModal] = useState<string>("");

  const handleRematch = (action: GameAction) => rematch(action, ws);

  return (
    <>
      <ScoreBoard player={player} playerNames={playerNames} score={score} />
      <RematchModal
        openModal={currentOpenModal}
        rematch={handleRematch}
        rematchStatus={rematchStatus}
        setOpenModal={setCurrentOpenModal}
      />
      <GameStatusModal
        boardStatus={boardStatus}
        openModal={currentOpenModal}
        player={player}
        rematch={handleRematch}
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

const ModalFrame = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <ModalContent
    className={cn(
      "border-foreground-100/70 bg-content1/90 rounded-2xl border",
      className,
    )}
  >
    <ModalBody className="p-6 md:p-7">{children}</ModalBody>
  </ModalContent>
);

const ScoreBoard = ({ player, score, playerNames }: ScoreBoardProps) => {
  const youName = playerNames
    ? player.marker === "X"
      ? (playerNames.player1 ?? "You")
      : (playerNames.player2 ?? "You")
    : "You";
  const oppName = playerNames
    ? player.marker === "X"
      ? (playerNames.player2 ?? "Opp")
      : (playerNames.player1 ?? "Opp")
    : "Opp";
  const round = score[0] + score[1] + 1;

  return (
    <div className="border-foreground-100/70 bg-content1/85 mx-auto grid w-full max-w-2xl grid-cols-3 items-center rounded-2xl border shadow-lg">
      <div className="border-foreground-100/60 flex h-full flex-col items-center justify-center gap-1 border-r px-4 py-3.5 text-center md:py-4">
        <span className="text-primary text-4xl font-black">
          {player.marker}
        </span>
        <p className="text-foreground-900 dark:text-foreground text-sm font-bold tracking-[0.08em] uppercase">
          {youName}
        </p>
      </div>

      <div className="border-foreground-100/60 flex h-full flex-col items-center justify-center border-r px-4 py-3.5 text-center md:py-4">
        <p className="text-foreground-900 dark:text-foreground text-4xl font-black tracking-tight">
          {score[player.marker === "X" ? 0 : 1]} :{" "}
          {score[player.marker === "X" ? 1 : 0]}
        </p>
        <p className="text-foreground-500 mt-1 text-xs font-bold tracking-[0.12em] uppercase">
          Round {round}
        </p>
      </div>

      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-3.5 text-center md:py-4">
        <span className="text-danger text-4xl font-black">
          {player.marker === "X" ? "O" : "X"}
        </span>
        <p className="text-foreground-900 dark:text-foreground text-sm font-bold tracking-[0.08em] uppercase">
          {oppName}
        </p>
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
  }, [rematchStatus, setOpenModal]);

  return (
    <Modal
      isOpen={openModal === "rematchModal"}
      placement="center"
      onClose={() => setOpenModal("")}
    >
      <ModalFrame>
        <div className="flex flex-col items-center gap-6">
          <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
            Match Update
          </p>
          <p className="text-foreground-900 dark:text-foreground text-center text-2xl font-bold">
            Opponent wants a rematch.
          </p>
          <div className="flex gap-3">
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
              variant="flat"
              onPress={() => {
                rematch(GameAction.Declined);
                setOpenModal("");
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      </ModalFrame>
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
  }, [boardStatus, setOpenModal]);

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
      <ModalFrame>
        <div className="flex flex-col items-center gap-6">
          <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
            Match Result
          </p>
          <p className="text-foreground-900 dark:text-foreground text-center text-2xl font-bold">
            {message}
          </p>
          <div className="flex gap-3">
            <Button color="primary" onPress={handleRematch}>
              Rematch?
            </Button>
            <Button variant="flat" onPress={() => setOpenModal("")}>
              Close
            </Button>
          </div>
        </div>
      </ModalFrame>
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
  }, [rematchStatus, setOpenModal]);

  return (
    <Modal
      isOpen={openModal === "rematchStatusModal"}
      placement="center"
      onClose={() => setOpenModal("")}
    >
      <ModalFrame>
        <div className="flex flex-col items-center gap-6">
          <p className="text-primary text-xs font-black tracking-[0.14em] uppercase">
            Rematch Status
          </p>
          <p className="text-foreground-900 dark:text-foreground text-center text-2xl font-bold">
            {rematchStatus === GameAction.Sent
              ? "Rematch Sent..."
              : rematchStatus === GameAction.Declined && "Opponent Declined."}
          </p>
          <Button variant="flat" onPress={() => setOpenModal("")}>
            Close
          </Button>
        </div>
      </ModalFrame>
    </Modal>
  );
};

export default GameStatus;
