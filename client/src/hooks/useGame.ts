import { useEffect, useState } from "react";

import { Board, BoardStatus, socketEvent } from "@/types";
import { playerActions } from "@/types/actions";
import { GameStore, PlayerStore, RoomStore } from "@/store";

// interface roomResponse {
//   id: string;
//   name: string;
//   bot_level: null | "Beginner" | "Intermediate" | "Advanced";
//   is_public: boolean;
//   is_protected: boolean;
// }

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
    console.log("Connected");

    let playerId: string | null = null;

    // handle on connection established
    ws.onopen = () => {
      setStatus({ status: RoomStatus.connected, message: "" });
    };

    // handle on message arrival
    ws.onmessage = (event) => {
      const e: socketEvent = JSON.parse(event.data);
      const eventName = e.event;
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
              if (playerId && !e.data.player.id) {
                message = "PlayerJoined";
                break;
              } else {
                playerId = e.data.player.id as string;
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

        case "TextMessage":
          pushMessage({
            content: e.data.content,
            player: e.data.player,
          });
          break;

        case "PING":
          ws.send("PONG");
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

  // const playMove = (mv: string) => {
  //   if (ws) {
  //     ws.send(
  //       JSON.stringify({
  //         GameUpdate: {
  //           mv,
  //         },
  //       }),
  //     );
  //   } else {
  //     console.warn("WebSocket is undefined");
  //   }
  // };

  return {
    ws,
    board,
    status,
    setStatus,
    player,
    // playMove,
  };
};

export default useGame;
