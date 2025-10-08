import { useEffect, useState } from "react";
import { Button } from "@heroui/button";

import { GameStore } from "@/store";
import { GameAction } from "@/types/actions";

interface actionsParams {
  drawStatus: GameAction | null;
}

function Actions({ drawStatus }: actionsParams) {
  const { draw, resign } = GameStore();
  const [isConfirm, setIsConfirm] = useState(false);

  useEffect(() => {
    if (!isConfirm) return;
    setTimeout(() => {
      setIsConfirm(false);
    }, 3000);
  }, [isConfirm]);

  return (
    <div className="flex w-full items-center justify-center gap-2">
      <Button
        isDisabled={!!drawStatus}
        onPress={() => {
          if (!!drawStatus) return;
          draw(GameAction.Requested);
        }}
      >
        {!!drawStatus ? "Requested" : "Request Draw"}
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
    </div>
  );
}

export default Actions;
