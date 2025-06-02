use serde::{Deserialize, Deserializer, Serialize, de};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct RoomInfo {
    pub id: String,
    pub name: String,
    pub is_public: bool,
    #[serde(skip_serializing, deserialize_with = "deserialize_bot_level")]
    pub bot_level: Option<u8>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    #[serde(skip_deserializing)]
    pub is_protected: bool,
}

fn deserialize_bot_level<'de, D>(deserializer: D) -> Result<Option<u8>, D::Error>
where
    D: Deserializer<'de>,
{
    let opt = Option::<String>::deserialize(deserializer)?;

    let level = match opt.as_deref() {
        Some("Beginner") => Some(2),
        Some("Intermediate") => Some(5),
        Some("Advanced") => Some(9),
        Some(_) => return Err(de::Error::custom("InvalidBotLevel")),
        None => None,
    };

    Ok(level)
}
