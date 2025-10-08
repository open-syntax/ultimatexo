import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";

import { BoardStatus } from "@/types";
import { GameAction } from "@/types/actions";
import { GameStore } from "@/store";
import { Player } from "@/types/player";

interface props {
  boardStatus: BoardStatus;
  rematchStatus: GameAction | null;
  player: Player;
  drawStatus: GameAction | null;
}

const GameStatus = ({ rematchStatus, drawStatus, player }: props) => {
  const { nextPlayer, rematch, draw } = GameStore();

  const [isOpen, setIsOepn] = useState(false);

  useEffect(() => {
    if (
      rematchStatus === GameAction.Requested ||
      drawStatus === GameAction.Requested
    ) {
      setIsOepn(true);
    }
  }, [rematchStatus, drawStatus]);

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

      <Modal isOpen={isOpen} placement="center" onOpenChange={setIsOepn}>
        <ModalContent className="w-fit">
          <ModalBody className="w-fit">
            <div className="flex flex-col items-center gap-4 px-8 py-4">
              <p>Opponent wants to {!!rematchStatus ? "rematch" : "draw"}.</p>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  onPress={() => {
                    if (!!rematchStatus) rematch(GameAction.Accepted);
                    else draw(GameAction.Accepted);

                    console.log("pressed");
                  }}
                >
                  Accept
                </Button>
                <Button
                  onPress={() => {
                    if (!!rematchStatus) rematch(GameAction.Declined);
                    else draw(GameAction.Declined);
                  }}
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

// const Rematch = ({
//   player,
//   onClick,
// }: {
//   player: "X" | "O" | "Draw";
//   onClick?: () => void;
// }) => {
//   return (
//     <>
//       <p>{player === "Draw" ? "Draw!" : `Player ${player} Won!`}</p>
//       <Button
//         className="w-fit animate-appearance-in"
//         color="primary"
//         onPress={onClick}
//       >
//         Rematch?
//       </Button>
//     </>
//   );
// };

export default GameStatus;
