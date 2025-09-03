use std::net::IpAddr;

use super::{Marker, ServerMessage};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc::UnboundedSender;
use uuid::Uuid;

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
    #[serde(skip_serializing)]
    pub id: String,
    #[serde(skip_serializing)]
    pub ip: IpAddr,
    #[serde(skip_serializing)]
    pub tx: Option<UnboundedSender<ServerMessage>>,
    pub info: PlayerInfo,
}

impl Player {
    pub fn new(ip: IpAddr, marker: Marker) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            ip,
            tx: None,
            info: PlayerInfo::new(marker),
        }
    }
}
