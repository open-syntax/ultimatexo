import { useEffect, useState } from "react";

import { Board, BoardStatus, socketEvent } from "@/types";
import { playerActions, RestartActions } from "@/types/actions";
import { GameStore, PlayerStore, RoomStore } from "@/store";
import { marker } from "@/types/player";

enum RoomStatus {
  loading = "loading",
  connected = "connected",
  disconnected = "disconnected",
  opponentLeft = "opponent left",
  connecting = "connecting",
  internal = "internal",
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
  const { pushMessage, clearChat, ws, mode } = RoomStore();

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

    let playerMarker: marker = null;

    // handle on connection established
    ws.onopen = () => {
      clearChat();
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      const e: socketEvent = JSON.parse(event.data);
      const eventName = e.event;

      if (e.event !== "Ping") {
        // eslint-disable-next-line no-console
        console.log(e);
      }

      switch (eventName) {
        case "GameUpdate":
          if (mode === "Local") {
            setPlayer({ marker: e.data.next_player.marker, id: "" });
            playerMarker = e.data.next_player.marker;
          }

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
                playerMarker = e.data.player.marker;

                sessionStorage.setItem(
                  "roomId",
                  window.location.pathname.split("/")[2],
                );
                setPlayer(e.data.player);
                message = "Connected";
                break;
              }

            case playerActions.PlayerLeft:
              status = RoomStatus.opponentLeft;
              message = "Opponent left";
              break;

            case playerActions.PlayerDisconnected:
              if (e.data.player.marker !== playerMarker) {
                status = RoomStatus.disconnected;
                message =
                  "Opponent disconnected \n Waiting for opponent to reconnect...";
              } else {
                status = RoomStatus.disconnected;
                message = "You disconnected \n reconnecting...";
              }

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
          switch (e.data.action) {
            case RestartActions.Requested:
              if (e.data.player === playerMarker) {
                setRematchStatus(RestartActions.Sent);
              } else {
                setRematchStatus(RestartActions.Requested);
              }
              break;
            case RestartActions.Accepted:
              setRematchStatus(RestartActions.Accepted);
              break;
            case RestartActions.Declined:
              setRematchStatus(RestartActions.Declined);
              break;
          }
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
          if (e.data.error === "InvalidPassword") {
            setStatus({
              status: RoomStatus.authFailed,
              message: "Invalid password",
            });

            break;
          }
          setStatus({
            status: RoomStatus.internal,
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
