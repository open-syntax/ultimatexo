use anyhow::Result;

use crate::{
    ai::evaluation::Evaluator,
    error::AppError,
    types::{GameState, Marker, Status},
    utils::parse_tuple,
};

#[derive(Default, Clone, Debug)]
pub struct Game {
    pub state: GameState,
}

impl Game {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn make_move(&mut self, position_str: &str) -> Result<()> {
        let position = parse_tuple(position_str)?;
        self.check_position(position)?;
        self.check_win(position)?;
        self.state.toggle_players();

        Ok(())
    }
    fn check_position(&mut self, (a, b): (usize, usize)) -> Result<(), AppError> {
        if self.state.board.status.ne(&Status::InProgress) {
            return Err(AppError::game_not_started());
        }
        if (self.state.next_board.is_none() || self.state.next_board.unwrap() == a)
            && self.state.board.boards[a].status.eq(&Status::InProgress)
            && self.state.board.boards[a].cells[b] == Marker::Empty
        {
            self.state.board.boards[a].cells[b] = self.state.players[0].marker;

            return Ok(());
        }
        Err(AppError::invalid_move())
    }
    fn check_win(&mut self, (a, b): (usize, usize)) -> Result<()> {
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
            let board = &mut self.state.board.boards[a];
            if board.cells[condition[0]].ne(&Marker::Empty)
                && board.cells[condition[0]].eq(&board.cells[condition[1]])
                && board.cells[condition[0]].eq(&board.cells[condition[2]])
            {
                board.status = Status::Won(board.cells[condition[0]]);
            } else if board.cells.iter().all(|marker| marker.ne(&Marker::Empty)) {
                board.status = Status::Draw;
            }
        }
        //checks of a game win
        let boards = self.state.board.boards;
        for condition in win_conditions {
            if boards[condition[0]]
                .status
                .eq(&Status::Won(self.state.players[0].marker))
                && boards[condition[0]].status.eq(&boards[condition[1]].status)
                && boards[condition[0]].status.eq(&boards[condition[2]].status)
            {
                self.state.board.status = Status::Won(self.state.players[0].marker);
                return Ok(());
            }
        }
        //checks for a game draw
        if boards
            .iter()
            .all(|board| board.status.ne(&Status::InProgress))
        {
            self.state.board.status = Status::Draw;
        }

        if self.state.board.boards[b].status == Status::InProgress {
            self.state.next_board = Some(b);
        } else {
            self.state.next_board = None;
        }
        Ok(())
    }

    pub fn generate_move(&mut self, level: u8) {
        use minimax::Strategy;
        let mut strategy = minimax::Negamax::new(Evaluator, level);

        if let Some(best_move) = strategy.choose_move(&self.state) {
            let position = (best_move.board as usize, best_move.cell as usize);
            self.check_position(position).unwrap();
            self.check_win(position).unwrap();
            self.state.toggle_players();
        }
    }

    pub fn restart_game(&mut self) {
        *self = Game::new();
    }
}
