import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

import { GameStore, RoomStore } from "@/store";
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
    <div className="mx-auto flex w-full max-w-[min(100%,40rem)] items-center justify-center gap-3">
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
        className="w-full"
        color="primary"
        isLoading={rematchSent}
        onPress={() => {
          if (!rematchSent) {
            rematch(GameAction.Requested);
          }
        }}
      >
        {rematchSent ? "Rematch Sent" : "Rematch"}
      </Button>
    </>
  );
};

const DuringGameActions = ({
  drawStatus,
  draw,
  resign,
}: DuringGameActionsProps) => {
  const { mode } = RoomStore();

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
  }, [drawStatus, draw]);

  return (
    <>
      {mode === "Online" ? (
        <Button
          className={`w-1/2 ${drawStatus === GameAction.Requested ? "animate-pulse" : ""}`}
          isDisabled={drawStatus === GameAction.Sent}
          variant="flat"
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
      ) : (
        <Tooltip content="Draw is available in online matches">
          <span className="w-1/2">
            <Button isDisabled className="w-full" variant="flat">
              Request Draw
            </Button>
          </span>
        </Tooltip>
      )}

      {/* Resign Button  */}
      {!isConfirm ? (
        <Button
          className="w-1/2"
          color="danger"
          variant="flat"
          onPress={() => setIsConfirm(true)}
        >
          Resign
        </Button>
      ) : (
        <Button
          className="w-1/2"
          color="danger"
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
