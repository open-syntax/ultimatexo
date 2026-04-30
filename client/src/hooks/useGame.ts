import { useEffect, useRef, useState } from "react";

import {
  Board,
  BoardStatus,
  socketEvent,
  RoomStatus,
  PlayerAction,
} from "@/types";
import { GameAction } from "@/types/actions";
import { GameStore, PlayerStore, RoomStore } from "@/store";
import { Marker } from "@/types/player";
import {
  playButton,
  playChat,
  playDraw,
  playGameWin,
  playJoin,
  playLeave,
  playMiniWin,
  playMoveO,
  playMoveX,
  playRequest,
  playTick,
} from "@/utils/sound";

interface RoomState {
  status: RoomStatus;
  message: string;
}

const useGame = () => {
  const { player, setPlayer } = PlayerStore();
  const { setMove, setNextPlayer } = GameStore();
  const { pushMessage, clearChat, ws } = RoomStore();
  const statusRef = useRef<RoomStatus>(RoomStatus.connecting);

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

  const updateStatus = (nextStatus: RoomStatus, message: string) => {
    statusRef.current = nextStatus;
    setStatus({ status: nextStatus, message });
  };

  const [disconnectOwner, setDisconnectOwner] = useState<
    "self" | "opponent" | null
  >(null);
  const [opponentReconnectSeconds, setOpponentReconnectSeconds] = useState<
    number | null
  >(null);

  // Refs for detecting state transitions to trigger sounds
  const prevBoardRef = useRef<Board | null>(null);
  const prevBoardStatusRef = useRef<BoardStatus | null | undefined>(undefined);
  const prevLastMoveRef = useRef<[number, number] | null>(null);
  const wonBoardsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!ws) return;

    let playerMarker: Marker = null;
    let unmounted = false;

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
          if (!unmounted) {
            updateStatus(RoomStatus.authFailed, "Invalid password");
          }
        }

        return;
      }
      const eventName = e.event;

      switch (eventName) {
        case "GameUpdate":
          if (RoomStore.getState().mode === "Local") {
            setPlayer({ marker: e.data.next_player.marker, id: "" });
            playerMarker = e.data.next_player.marker;
          }

          // Play move sound for newly-received moves
          if (e.data.last_move !== null) {
            const isNewMove =
              prevLastMoveRef.current === null ||
              prevLastMoveRef.current[0] !== e.data.last_move[0] ||
              prevLastMoveRef.current[1] !== e.data.last_move[1];

            if (isNewMove) {
              const justMoved = e.data.next_player.marker === "X" ? "O" : "X";

              if (justMoved === "X") {
                playMoveX();
              } else {
                playMoveO();
              }
            }
          }
          prevLastMoveRef.current = e.data.last_move;

          // Detect mini-board win
          if (prevBoardRef.current !== null) {
            for (let i = 0; i < 9; i++) {
              const newStatus = e.data.board.boards[i].status;

              if (
                (newStatus === "X" || newStatus === "O") &&
                !wonBoardsRef.current.has(i)
              ) {
                wonBoardsRef.current.add(i);
                playMiniWin();
                break;
              }
            }
          }
          prevBoardRef.current = e.data.board.boards;

          // Detect game win or draw
          if (prevBoardStatusRef.current !== undefined) {
            const prevStatus = prevBoardStatusRef.current;
            const newStatus = e.data.board.status;

            if (prevStatus === null && newStatus !== null) {
              if (newStatus === BoardStatus.Draw) {
                playDraw();
              } else {
                playGameWin();
              }
            }
          }
          prevBoardStatusRef.current = e.data.board.status;

          setBoard(e.data.board);
          setScore(e.data.score);

          setMove({
            nextMove: e.data.next_board,
            lastMove: e.data.last_move,
          });
          setNextPlayer(e.data.next_player.marker);
          break;

        case "PlayerUpdate": {
          const action = e.data.action as PlayerAction;
          const isDisconnectedObject =
            typeof action === "object" && "Disconnected" in action;

          if (isDisconnectedObject) {
            const seconds = action.Disconnected;
            const isOpponent = e.data.player.marker !== playerMarker;

            if (isOpponent) {
              setDisconnectOwner("opponent");
              setOpponentReconnectSeconds(seconds);
              updateStatus(
                RoomStatus.disconnected,
                "Opponent disconnected. Waiting for reconnection...",
              );
            } else {
              setDisconnectOwner("self");
              setOpponentReconnectSeconds(null);
              updateStatus(
                RoomStatus.disconnected,
                "You disconnected. Reconnecting...",
              );
            }
            playLeave();
            break;
          }

          if (action === "Joined" || action === "Reconnected") {
            setDisconnectOwner(null);
            setOpponentReconnectSeconds(null);

            const newStatus = RoomStatus.connected;
            const message = "Connected";

            if (!playerMarker) {
              playerMarker = e.data.player.marker;
              sessionStorage.setItem(
                "roomId",
                window.location.pathname.split("/")[2],
              );
              sessionStorage.setItem("playerId", e.data.player.id);
              setPlayer(e.data.player);
            }

            if (!unmounted) {
              updateStatus(newStatus, message);
            }
            playJoin();
            break;
          }

          if (action === "Left") {
            setDisconnectOwner(null);
            setOpponentReconnectSeconds(null);
            if (!unmounted) {
              updateStatus(RoomStatus.opponentLeft, "Opponent left");
            }
            playLeave();
            break;
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
          if (e.data.action === GameAction.Requested) {
            playRequest();
          }
          if (e.data.action === GameAction.Accepted) {
            // Reset sound state refs for a new game
            prevBoardRef.current = null;
            prevBoardStatusRef.current = undefined;
            prevLastMoveRef.current = null;
            wonBoardsRef.current.clear();
            playButton();
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
              playRequest();
              break;
            case GameAction.Accepted:
              setDrawStatus(e.data.action);
              playDraw();
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
          playChat();
          break;

        case "Ping":
          ws.send(JSON.stringify("Pong"));
          break;

        case "Error":
          if (e.data.error === "InvalidPassword") {
            if (!unmounted) {
              updateStatus(RoomStatus.authFailed, "Invalid password");
            }
            break;
          }
          if (!unmounted) {
            updateStatus(RoomStatus.internal, e.data.error);
          }
          break;

        default:
          break;
      }
    };

    ws.onclose = () => {
      if (unmounted) return;
      if (RoomStore.getState().ws !== ws) return;
      if (statusRef.current === RoomStatus.authFailed) return;

      setDisconnectOwner("self");
      setOpponentReconnectSeconds(null);
      updateStatus(RoomStatus.disconnected, "Connection lost");
    };

    return () => {
      unmounted = true;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
    };
  }, [ws, clearChat, pushMessage, setPlayer, setMove, setNextPlayer]);

  useEffect(() => {
    if (disconnectOwner !== "opponent" || opponentReconnectSeconds === null) {
      return;
    }

    const interval = setInterval(() => {
      setOpponentReconnectSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }

        if (prev <= 10) {
          playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disconnectOwner, opponentReconnectSeconds]);

  return {
    ws,
    board,
    score,
    status,
    rematchStatus,
    drawStatus,
    setStatus,
    player,
    disconnectOwner,
    opponentReconnectSeconds,
  };
};

export default useGame;
