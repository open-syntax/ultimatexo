import { useEffect, useState } from "react";
import { Button } from "@heroui/button";

import { GameStore } from "@/store";
import { GameAction } from "@/types/actions";
import { BoardStatus } from "@/types";

interface ActionsParams {
  drawStatus: GameAction | null;
  rematchStatus: GameAction | null;
  boardStatus: BoardStatus | null;
}

interface PostGameActions {
  rematchStatus: GameAction | null;
  rematch: (action: GameAction) => void;
}

interface DuringGameActionsProps {
  drawStatus: GameAction | null;
  draw: (action: GameAction) => void;
  resign: () => void;
}

function Actions({ drawStatus, rematchStatus, boardStatus }: ActionsParams) {
  const { draw, resign, rematch } = GameStore();

  return (
    <div className="flex w-full items-center justify-center gap-2">
      {!boardStatus ? (
        <DuringGameActions
          draw={draw}
          drawStatus={drawStatus}
          resign={resign}
        />
      ) : (
        <PostGameActions rematch={rematch} rematchStatus={rematchStatus} />
      )}
    </div>
  );
}

const PostGameActions = ({ rematch, rematchStatus }: PostGameActions) => {
  const rematchSent = rematchStatus === GameAction.Sent;

  return (
    <>
      <Button
        isLoading={rematchSent}
        onPress={() => {
          rematchSent || rematch(GameAction.Requested);
        }}
      >
        {rematchSent ? "Rematch" : "Rematch Sent"}
      </Button>
    </>
  );
};

const DuringGameActions = ({
  drawStatus,
  draw,
  resign,
}: DuringGameActionsProps) => {
  const [isConfirm, setIsConfirm] = useState(false);

  useEffect(() => {
    if (!isConfirm) return;
    setTimeout(() => {
      setIsConfirm(false);
    }, 3000);
  }, [isConfirm]);

  useEffect(() => {
    if (drawStatus !== GameAction.Requested) return;

    setTimeout(() => {
      draw(GameAction.Declined);
    }, 10000); // 10 seconds and send rejection
  }, [drawStatus]);

  return (
    <>
      <Button
        className={drawStatus === GameAction.Requested ? "animate-pulse" : ""}
        isDisabled={drawStatus === GameAction.Sent}
        onPress={() => {
          if (drawStatus === GameAction.Sent) return;
          if (drawStatus === GameAction.Requested)
            return draw(GameAction.Accepted);
          draw(GameAction.Requested);
        }}
      >
        {drawStatus === GameAction.Sent
          ? "Draw Requested"
          : drawStatus === GameAction.Requested
            ? "Accept Draw"
            : "Request Draw"}
      </Button>

      {/* Resign Button  */}
      {!isConfirm ? (
        <Button onPress={() => setIsConfirm(true)}>Resign</Button>
      ) : (
        <Button
          onPress={() => {
            resign();
            setIsConfirm(false);
          }}
        >
          Are you sure?
        </Button>
      )}
    </>
  );
};

export default Actions;
