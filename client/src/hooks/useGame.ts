import { useEffect, useRef, useState } from "react";

import { Board, BoardStatus, socketEvent, RoomStatus } from "@/types";
import { playerActions, GameAction } from "@/types/actions";
import { GameStore, PlayerStore, RoomStore } from "@/store";
import { Marker } from "@/types/player";

interface RoomState {
  status: RoomStatus;
  message: string;
}

const useGame = () => {
  const { player, setPlayer } = PlayerStore();
  const { setMove, setNextPlayer } = GameStore();
  const { pushMessage, clearChat, ws } = RoomStore();
  const modeRef = useRef(RoomStore.getState().mode);

  const [rematchStatus, setRematchStatus] = useState<GameAction | null>(null);
  const [drawStatus, setDrawStatus] = useState<GameAction | null>(null);
  const [score, setScore] = useState<[number, number]>([0, 0]);

  const [board, setBoard] = useState<{
    boards: Board;
    status: BoardStatus | null;
  } | null>(null);

  const [status, setStatus] = useState<RoomState>({
    status: RoomStatus.connecting,
    message: "",
  });

  useEffect(() => {
    if (!ws) return;

    let playerMarker: Marker = null;
    let closed = false;

    ws.onopen = () => {
      clearChat();
    };

    ws.onmessage = (event) => {
      let e: socketEvent;
      try {
        e = JSON.parse(event.data);
      } catch {
        if (
          typeof event.data === "string" &&
          event.data.includes("Invalid room password")
        ) {
          if (!closed) {
            setStatus({
              status: RoomStatus.authFailed,
              message: "Invalid password",
            });
          }
        }
        return;
      }
      const eventName = e.event;
      const currentMode = modeRef.current;

      switch (eventName) {
        case "GameUpdate":
          if (currentMode === "Local") {
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
          let newStatus: RoomStatus;
          let message: string;

          switch (e.data.action) {
            case playerActions.PlayerReconnected:
            case playerActions.PlayerJoined:
              newStatus = RoomStatus.connected;
              if (playerMarker) {
                message = "PlayerJoined";
              } else {
                playerMarker = e.data.player.marker;

                sessionStorage.setItem(
                  "roomId",
                  window.location.pathname.split("/")[2],
                );
                sessionStorage.setItem("playerId", e.data.player.id);
                setPlayer(e.data.player);
                message = "Connected";
              }
              break;

            case playerActions.PlayerLeft:
              newStatus = RoomStatus.opponentLeft;
              message = "Opponent left";
              break;

            case playerActions.PlayerDisconnected:
              newStatus = RoomStatus.disconnected;
              message =
                e.data.player.marker !== playerMarker
                  ? "Opponent disconnected \n Waiting for opponent to reconnect..."
                  : "You disconnected \n reconnecting...";
              break;

            default:
              newStatus = RoomStatus.error;
              message = "Invalid player action";
              break;
          }

          if (!closed) {
            setStatus({ status: newStatus, message });
          }
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

        case "TextMessage":
          pushMessage({
            content: e.data.content,
            player: e.data.player,
          });
          break;

        case "Ping":
          ws.send(JSON.stringify({ Ping: "Pong" }));
          break;

        case "Error":
          if (e.data.error === "InvalidPassword") {
            if (!closed) {
              setStatus({
                status: RoomStatus.authFailed,
                message: "Invalid password",
              });
            }
            break;
          }
          if (!closed) {
            setStatus({
              status: RoomStatus.internal,
              message: e.data.error,
            });
          }
          break;

        default:
          break;
      }
    };

    ws.onclose = () => {
      closed = true;
      if (status.status === RoomStatus.authFailed) return;
      setStatus({
        status: RoomStatus.disconnected,
        message: "Cannot connect",
      });
    };

    return () => {
      closed = true;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
    };
  }, [ws, clearChat, pushMessage, setPlayer, setMove, setNextPlayer]);

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
