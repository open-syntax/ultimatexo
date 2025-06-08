use serde::{Deserialize, Serialize};
use tokio::sync::{OnceCell, mpsc::UnboundedSender};

use super::{Marker, ServerMessage};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PlayerInfo {
    pub marker: Marker,
}

impl PlayerInfo {
    pub fn new(marker: Marker) -> Self {
        Self { marker }
    }
}
#[derive(Clone, Debug, Serialize)]
pub struct Player {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing)]
    pub tx: OnceCell<UnboundedSender<ServerMessage>>,
    pub info: PlayerInfo,
}

impl Player {
    pub fn new(id: String, marker: Marker) -> Self {
        Self {
            id: Some(id),
            tx: OnceCell::new(),
            info: PlayerInfo::new(marker),
        }
    }
}
