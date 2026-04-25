import { useEffect, useRef, useState } from "react";

import { Board, BoardStatus, socketEvent, RoomStatus } from "@/types";
import { playerActions, GameAction } from "@/types/actions";
import { GameStore, PlayerStore, RoomStore } from "@/store";
import { marker } from "@/types/player";

interface room {
  status: RoomStatus;
  message: string;
}

const useGame = () => {
  const { player, setPlayer } = PlayerStore();
  const { setMove, setNextPlayer } = GameStore();
  const { pushMessage, clearChat, ws, mode } = RoomStore();

  const [rematchStatus, setRematchStatus] = useState<GameAction | null>(null);
  const [drawStatus, setDrawStatus] = useState<GameAction | null>(null);
  const [score, setScore] = useState<[number, number]>([0, 0]);

  const [board, setBoard] = useState<{
    boards: Board;
    status: BoardStatus | null;
  } | null>(null);

  const [status, setStatus] = useState<room>({
    status: RoomStatus.connecting,
    message: "",
  });

  const statusRef = useRef<RoomStatus>(RoomStatus.connecting);

  useEffect(() => {
    if (!ws) return;

    let playerMarker: marker = null;

    // handle on connection established
    ws.onopen = () => {
      clearChat();
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      let e: socketEvent;

      try {
        e = JSON.parse(event.data);
      } catch {
        if (
          typeof event.data === "string" &&
          event.data.includes("Invalid room password")
        ) {
          setStatus({
            status: RoomStatus.authFailed,
            message: "Invalid password",
          });
          statusRef.current = RoomStatus.authFailed;
        }

        return;
      }
      const eventName = e.event;

      switch (eventName) {
        case "GameUpdate":
          if (mode === "Local") {
            setPlayer({ marker: e.data.next_player.marker, id: "" });
            playerMarker = e.data.next_player.marker;
          }

          setBoard(e.data.board);
          setScore(e.data.score);

          setMove({
            nextMove: e.data.next_board,
            lastMove: e.data.last_move,
          });
          setNextPlayer(e.data.next_player.marker);
          break;

        case "PlayerUpdate": {
          let status: RoomStatus, message: string;

          switch (e.data.action) {
            case playerActions.PlayerReconnected:
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
                sessionStorage.setItem("playerId", e.data.player.id);
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
          statusRef.current = status;
          break;
        }

        case "RematchRequest":
          if (e.data.player === playerMarker) {
            if (e.data.action === GameAction.Requested)
              setRematchStatus(GameAction.Sent);
          } else {
            setRematchStatus(e.data.action);
          }
          break;

        case "DrawRequest":
          switch (e.data.action) {
            case GameAction.Requested:
              if (e.data.player === playerMarker) {
                setDrawStatus(GameAction.Sent);
              } else {
                setDrawStatus(GameAction.Requested);
              }
              break;
            default:
              setDrawStatus(e.data.action);
              break;
          }
          break;

        default:
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
            statusRef.current = RoomStatus.authFailed;

            break;
          }
          setStatus({
            status: RoomStatus.internal,
            message: e.data.error,
          });
          statusRef.current = RoomStatus.internal;
          break;
      }
    };

    // handle on disconnection
    ws.onclose = () => {
      if (statusRef.current === RoomStatus.authFailed) return;
      setStatus({
        status: RoomStatus.disconnected,
        message: "Cannot connect",
      });
    };
  }, [ws]);

  return {
    ws,
    board,
    score,
    status,
    rematchStatus,
    drawStatus,
    setStatus,
    player,
  };
};

export default useGame;
