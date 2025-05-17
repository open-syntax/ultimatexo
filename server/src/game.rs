use crate::{minimax::Evaluator, utils::parse_tuple};
use anyhow::{Ok, Result, anyhow};
use serde::{Deserialize, Serialize, Serializer};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub enum Marker {
    Empty,
    X,
    O,
}
impl Default for Marker {
    fn default() -> Self {
        Self::Empty
    }
}
impl Serialize for Marker {
    fn serialize<T>(&self, serializer: T) -> Result<T::Ok, T::Error>
    where
        T: Serializer,
    {
        match self {
            Marker::Empty => serializer.serialize_none(),
            Marker::X => serializer.serialize_char('X'),
            Marker::O => serializer.serialize_char('O'),
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct Player {
    pub id: String,
    pub marker: Marker,
}
impl Player {
    fn new(id: String, marker: Marker) -> Self {
        Self { id, marker }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub enum Status {
    InProgress,
    Won(Marker),
    Draw,
}

impl Default for Status {
    fn default() -> Self {
        Status::InProgress
    }
}
impl Serialize for Status {
    fn serialize<T>(&self, serializer: T) -> Result<T::Ok, T::Error>
    where
        T: Serializer,
    {
        match self {
            Status::InProgress => serializer.serialize_none(),
            Status::Draw => serializer.serialize_some("Draw"),
            Status::Won(marker) => serializer.serialize_some(&marker),
        }
    }
}
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct MacroBoard {
    pub cells: [Marker; 9],
    pub status: Status,
}

#[derive(Default, Clone, Serialize, Deserialize, Debug)]
pub struct Board {
    pub boards: [MacroBoard; 9],
    pub status: Status,
}

#[derive(Default, Clone, Debug)]
pub struct GameState {
    pub players: Vec<Player>,
    pub board: Board,
    pub next_board: Option<usize>,
}
impl GameState {
    pub fn toggle_players(&mut self) {
        let temp = self.players[0].clone();
        self.players[0] = self.players[1].clone();
        self.players[1] = temp;
    }
}
#[derive(Default, Clone, Debug)]
pub struct Game {
    pub state: GameState,
}

impl Game {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_player(&mut self) -> Player {
        let mut player = Player::new(Uuid::new_v4().to_string(), Marker::X);
        if self.state.players.len() == 1 {
            player.marker = Marker::O;
        }
        self.state.players.push(player.clone());
        player
    }

    pub fn remove_player(&mut self, id: &String) -> Result<bool> {
        self.state.players.retain(|player| &player.id == id);
        Ok(self.state.players.len() == 0)
    }

    pub fn update_game(&mut self, position_str: &str, player_id: &str) -> Result<()> {
        if self.state.players[0].id.as_str() != player_id {
            return Err(anyhow!("ILLEGAL_TURN"));
        }
        let position = parse_tuple(position_str)?;
        self.check_position(position)?;
        self.check_win(position.0)?;
        self.state.toggle_players();

        Ok(())
    }
    fn check_position(&mut self, (a, b): (usize, usize)) -> Result<bool> {
        if self.state.players.len() < 2 {
            return Err(anyhow!("MISSING_A_PLAYER"));
        }
        if self.state.next_board.is_none() || self.state.next_board.unwrap() == a {
            if self.state.board.boards[a].cells[b] == Marker::Empty {
                self.state.board.boards[a].cells[b] = self.state.players[0].marker;
                if self.state.board.boards[a]
                    .cells
                    .iter()
                    .all(|cell| cell.ne(&Marker::Empty))
                {
                    self.state.board.boards[a].status = Status::Draw;
                }
                if self.state.board.boards[b]
                    .cells
                    .iter()
                    .all(|marker| marker != &Marker::Empty)
                {
                    self.state.next_board = Some(b);
                } else {
                    self.state.next_board = None;
                }
                return Ok(true);
            }
        }

        Err(anyhow!("INVALID_MOVE"))
    }
    fn check_win(&mut self, index: usize) -> Result<bool> {
        let win_conditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        //checks of a win in current MacroBoard
        for condition in win_conditions {
            let board = self.state.board.boards[index].clone();
            if board.cells[condition[0]].ne(&Marker::Empty)
                && board.cells[condition[0]].eq(&board.cells[condition[1]])
                && board.cells[condition[0]].eq(&board.cells[condition[2]])
            {
                self.state.board.boards[index].status = Status::Won(self.state.players[0].marker);
            }
        }
        //checks of a game win
        for condition in win_conditions {
            let boards = self.state.board.boards.clone();
            if boards[condition[0]]
                .status
                .eq(&Status::Won(self.state.players[0].marker))
                && boards[condition[0]].status.eq(&boards[condition[1]].status)
                && boards[condition[0]].status.eq(&boards[condition[2]].status)
            {
                self.state.board.status = Status::Won(self.state.players[0].marker);
            }
        }
        //checks for a game draw
        if self
            .state
            .board
            .boards
            .iter()
            .all(|board| board.status.ne(&Status::InProgress))
        {
            self.state.board.status = Status::Draw;
        }

        Ok(true)
    }

    pub fn generate_move(&mut self, level: usize) {
        use minimax::Strategy;
        let mut strategy = minimax::Negamax::new(Evaluator, level as u8);

        if let Some(best_move) = strategy.choose_move(&self.state) {
            let position = (best_move.board as usize, best_move.cell as usize);
            self.check_position(position).unwrap();
            self.state.toggle_players();
        }
    }

    // pub fn restart_game(&mut self) {
    //     *self = Self::default();
    //     self.player_won = None;
    // }
}
