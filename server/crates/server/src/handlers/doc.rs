use utoipa::OpenApi;

use crate::handlers::{
    api::{
        __path_check_server_memory, __path_create_room, __path_get_room, __path_get_rooms,
        __path_health_check,
    },
    websocket::__path_websocket_handler,
};
use ultimatexo_core::{
    Action, Board, ClientMessage, GetRoomQuery, PlayerAction, RoomInfo, SerizlizedPlayer,
    ServerMessage, WebSocketQuery,
};

#[derive(OpenApi)]
#[openapi(
    paths(
        websocket_handler,
        get_rooms,
        get_room,
        create_room,
        check_server_memory,
        health_check,
    ),
    components(
        schemas(
            ClientMessage,
            ServerMessage,
            WebSocketQuery,
            Action,
            PlayerAction,
            SerizlizedPlayer,
            RoomInfo,
            GetRoomQuery,
            Board,
        )
    ),
    tags(
        (name = "websocket", description = "WebSocket endpoints for real-time game communication"),
        (name = "rooms", description = "Room management endpoints"),
        (name = "system", description = "System health and monitoring endpoints")
    ),
    )]
pub struct ApiDoc;
