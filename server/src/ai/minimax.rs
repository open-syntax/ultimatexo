use crate::{
    domain::GameEngine,
    models::{GameState, Marker, Status},
};

#[derive(Copy, Clone, PartialEq, Eq, Default, Debug)]
pub struct Place {
    pub board: u8,
    pub cell: u8,
    p_board: Option<usize>,
}

impl minimax::Game for GameEngine {
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
                        p_board: state.next_board,
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
                            p_board: state.next_board,
                        });
                    }
                }
            }
        }
    }

    fn get_winner(state: &GameState) -> Option<minimax::Winner> {
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

    fn apply(state: &mut GameState, mut m: Place) -> Option<GameState> {
        state.board.boards[m.board as usize].cells[m.cell as usize] = state.players[0].marker;
        m.p_board = state.next_board;
        state.next_board = Some(m.cell as usize);
        state.toggle_players();
        None
    }
    fn undo(state: &mut GameState, m: Place) {
        state.board.boards[m.board as usize].cells[m.cell as usize] = Marker::Empty;
        state.next_board = m.p_board;
        state.toggle_players();
    }
}
