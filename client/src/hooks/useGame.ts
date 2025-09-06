import { useEffect, useState } from "react";

import { Board, BoardStatus, socketEvent } from "@/types";
import { playerActions, RestartActions } from "@/types/actions";
import { GameStore, PlayerStore, RoomStore } from "@/store";
import { PlayerInfo } from "@/types/player";

enum RoomStatus {
  loading = "loading",
  connected = "connected",
  disconnected = "disconnected",
  opponentLeft = "opponent left",
  connecting = "connecting",
  error = "error",
  auth = "auth required",
  authFailed = "auth failed",
  notFound = "room not found",
}

interface room {
  status: RoomStatus;
  message: string;
}

const useGame = () => {
  const { player, setPlayer } = PlayerStore();
  const { setMove, setNextPlayer } = GameStore();
  const { pushMessage, ws } = RoomStore();

  const [rematchStatus, setRematchStatus] = useState<RestartActions | null>(
    null,
  );

  const [board, setBoard] = useState<{
    boards: Board;
    status: BoardStatus;
  } | null>(null);

  const [status, setStatus] = useState<room>({
    status: RoomStatus.connecting,
    message: "",
  });

  useEffect(() => {
    if (!ws) return;
    // eslint-disable-next-line no-console
    console.info("Connected");

    let playerMarker: PlayerInfo["marker"] = null;

    // handle on connection established
    ws.onopen = () => {
      setStatus({ status: RoomStatus.connected, message: "" });
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      const e: socketEvent = JSON.parse(event.data);
      const eventName = e.event;

      // eslint-disable-next-line no-console
      console.log(e);

      switch (eventName) {
        case "GameUpdate":
          setBoard(e.data.board);
          setMove({
            nextMove: e.data.next_board,
            lastMove: e.data.last_move,
          });
          setNextPlayer(e.data.next_player.marker);
          break;

        case "PlayerUpdate":
          let status: RoomStatus, message: string;

          switch (e.data.action) {
            case playerActions.PlayerJoined:
              status = RoomStatus.connected;
              if (playerMarker) {
                message = "PlayerJoined";
                break;
              } else {
                playerMarker = e.data.player;

                sessionStorage.setItem(
                  "roomId",
                  window.location.pathname.split("/")[2],
                );
                setPlayer(e.data.player);
                message = "Connected";
                break;
              }

            case playerActions.PlayerLeft:
              status = RoomStatus.connected;
              message = "Player is Connected";
              break;

            case playerActions.PlayerDisconnected:
              status = RoomStatus.disconnected;
              message = "Disconnected";
              break;

            default:
              status = RoomStatus.error;
              message = "Invalid player action";
              break;
          }

          setStatus({
            status,
            message,
          });
          break;

        case "GameRestart":
          if (
            [RestartActions.Accepted, RestartActions.Declined].includes(
              e.data.action,
            ) &&
            e.data.player === player
          )
            setRematchStatus(RestartActions.Sent);
          else setRematchStatus(e.data.action);
          break;

        case "TextMessage":
          pushMessage({
            content: e.data.content,
            player: e.data.player,
          });
          break;

        case "Ping":
          ws.send(JSON.stringify("Pong"));
          break;

        case "Error":
          setStatus({
            status: RoomStatus.error,
            message: e.data.error,
          });
          break;
      }
    };

    // handle on disconnection
    ws.onclose = () => {
      setStatus((state) => ({
        ...state,
        status: RoomStatus.disconnected,
        message: "Cannot connect",
      }));
    };
  }, [ws]);

  return {
    ws,
    board,
    status,
    rematchStatus,
    setStatus,
    player,
  };
};

export default useGame;
