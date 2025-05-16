use crate::game::{Game, GameState, Marker, Status};

#[derive(Copy, Clone, PartialEq, Eq, Default)]
pub struct Place {
    pub board: u8,
    pub cell: u8,
}

impl minimax::Game for Game {
    type S = GameState;
    type M = Place;

    fn generate_moves(state: &GameState, ms: &mut Vec<Place>) {
        if state.next_board.is_some() {
            let board = state.board.boards[state.next_board.unwrap()].clone();
            for cell_index in 0..board.cells.len() {
                if board.cells[cell_index] == Marker::Empty {
                    ms.push(Place {
                        cell: cell_index as u8,
                        board: state.next_board.unwrap() as u8,
                    });
                }
            }
        } else {
            for (board_index, macro_board) in state.board.boards.iter().enumerate() {
                for cell_index in 0..macro_board.cells.len() {
                    if macro_board.cells[cell_index] == Marker::Empty {
                        ms.push(Place {
                            cell: cell_index as u8,
                            board: board_index as u8,
                        });
                    }
                }
            }
        }
    }

    fn get_winner(state: &GameState) -> Option<minimax::Winner> {
        dbg!("test");
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
        //checks of a game win
        for mut board in state.board.boards {
            for condition in win_conditions {
                if board.cells[condition[0]].ne(&Marker::Empty)
                    && board.cells[condition[0]].eq(&board.cells[condition[1]])
                    && board.cells[condition[0]].eq(&board.cells[condition[2]])
                {
                    board.status = Status::Won(state.players[0].marker);
                }
            }
            if board.cells.iter().all(|marker| marker.ne(&Marker::Empty)) {
                board.status = Status::Won(state.players[0].marker)
            }
        }
        for condition in win_conditions {
            let boards = state.board.boards;
            if boards[condition[0]].status.ne(&Status::InProgress)
                && boards[condition[0]].status.ne(&Status::Draw)
                && boards[condition[0]].status.eq(&boards[condition[1]].status)
                && boards[condition[0]].status.eq(&boards[condition[2]].status)
            {
                return Some(minimax::Winner::PlayerJustMoved);
            }
        }
        //checks for a game draw
        if state
            .board
            .boards
            .iter()
            .all(|board| board.status.ne(&Status::InProgress))
        {
            return Some(minimax::Winner::Draw);
        } else {
            None
        }
    }

    fn apply(state: &mut GameState, m: Place) -> Option<GameState> {
        state.board.boards[m.board as usize].cells[m.cell as usize] = state.players[0].marker;
        state.next_board = Some(m.board as usize);
        state.toggle_players();
        None
    }
    fn undo(state: &mut GameState, m: Place) {
        state.board.boards[m.board as usize].cells[m.cell as usize] = Marker::Empty;
        state.toggle_players();
    }
}

#[derive(Default)]
pub struct Evaluator;

impl minimax::Evaluator for Evaluator {
    type G = Game;
    fn evaluate(&self, state: &GameState) -> minimax::Evaluation {
        let mut score = 0;
        let board = state.board.clone();

        for board in board.boards {
            for i in 0..3 {
                let line = i * 3;
                if board.cells[line + 0] == board.cells[line + 1] {
                    if board.cells[line + 0] == state.players[0].marker {
                        score += 5;
                    } else if board.cells[line + 0] == state.players[1].marker {
                        score -= 5;
                    }
                }
                if board.cells[line + 1] == board.cells[line + 2] {
                    if board.cells[line + 1] == state.players[0].marker {
                        score += 5;
                    } else if board.cells[line + 1] == state.players[1].marker {
                        score += 5;
                    }
                }
                if board.cells[i] == board.cells[3 + i] {
                    if board.cells[i] == state.players[0].marker {
                        score += 5;
                    } else if board.cells[i] == state.players[1].marker {
                        score -= 5;
                    }
                }
                if board.cells[3 + i] == board.cells[6 + i] {
                    if board.cells[3 + i] == state.players[0].marker {
                        score += 5;
                    } else if board.cells[3 + i] == state.players[1].marker {
                        score -= 5;
                    }
                }
            }
            // 2nd: check for the middle square
            if board.cells[4] == state.players[0].marker {
                score += 5;
            }
            if board.cells[4] == state.players[1].marker {
                score -= 5;
            }
        }

        // 3rd: check for doubles
        for i in 0..3 {
            let line = i * 3;
            if board.boards[line + 0].status == board.boards[line + 1].status {
                if board.boards[line + 0].status == Status::Won(state.players[0].marker) {
                    score += 10;
                } else if board.boards[line + 0].status == Status::Won(state.players[0].marker) {
                    score -= 10;
                }
            }
            if board.boards[line + 1].status == board.boards[line + 2].status {
                if board.boards[line + 1].status == Status::Won(state.players[0].marker) {
                    score += 10;
                } else if board.boards[line + 1].status == Status::Won(state.players[1].marker) {
                    score += 10;
                }
            }
            if board.boards[i].status == board.boards[3 + i].status {
                if board.boards[i].status == Status::Won(state.players[0].marker) {
                    score += 10;
                } else if board.boards[i].status == Status::Won(state.players[1].marker) {
                    score -= 10;
                }
            }
            if board.boards[3 + i].status == board.boards[6 + i].status {
                if board.boards[3 + i].status == Status::Won(state.players[0].marker) {
                    score += 10;
                } else if board.boards[3 + i].status == Status::Won(state.players[1].marker) {
                    score -= 10;
                }
            }
        }
        // 2nd: check for the middle square
        if board.boards[4].status == Status::Won(state.players[0].marker) {
            score += 10;
        }
        if board.boards[4].status == Status::Won(state.players[1].marker) {
            score -= 10;
        }
        if state.players[1].marker == state.players[0].marker {
            score
        } else {
            -score
        }
    }
}
