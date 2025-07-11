use crate::{
    domain::GameEngine,
    models::{GameState, Marker, Status},
};

#[derive(Default)]
pub struct Evaluator;

impl minimax::Evaluator for Evaluator {
    type G = GameEngine;
    fn evaluate(&self, state: &GameState) -> minimax::Evaluation {
        let mut score = 0;
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
        let board = state.board.clone();
        for board in board.boards {
            for condition in win_conditions {
                let a = &board.cells[condition[0]];
                let b = &board.cells[condition[1]];
                let c = &board.cells[condition[2]];
                if a == b {
                    if a == &Marker::X {
                        if c == &Marker::Empty {
                            score += 1;
                        }
                        score += 5;
                    } else if c == &Marker::O {
                        if c == &Marker::Empty {
                            score -= 1;
                        }
                        score -= 5;
                    }
                }
                if b == c {
                    if b == &Marker::X {
                        if a == &Marker::Empty {
                            score += 1;
                        }
                        score += 5;
                    } else if c == &Marker::O {
                        if a == &Marker::Empty {
                            score -= 1;
                        }
                        score -= 5;
                    }
                }
                if c == a {
                    if c == &Marker::X {
                        if b == &Marker::Empty {
                            score += 1;
                        }
                        score += 5;
                    } else if c == &Marker::O {
                        if b == &Marker::Empty {
                            score -= 1;
                        }
                        score -= 5;
                    }
                }
            }
        }

        for condition in win_conditions {
            let a = &board.boards[condition[0]].status;
            let b = &board.boards[condition[1]].status;
            let c = &board.boards[condition[2]].status;
            if a == b {
                if a == &Status::Won(Marker::X) {
                    if c == &Status::InProgress {
                        score += 10;
                    }
                    score += 20;
                } else if a == &Status::Won(Marker::O) {
                    if c == &Status::InProgress {
                        score -= 10;
                    }
                    score -= 20;
                }
            }
            if b == c {
                if b == &Status::Won(Marker::X) {
                    if a == &Status::InProgress {
                        score += 10;
                    }
                    score += 20;
                } else if a == &Status::Won(Marker::O) {
                    if a == &Status::InProgress {
                        score -= 10;
                    }
                    score -= 20;
                }
            }
            if c == a {
                if c == &Status::Won(Marker::X) {
                    if b == &Status::InProgress {
                        score += 10;
                    }
                    score += 20;
                } else if a == &Status::Won(Marker::O) {
                    if b == &Status::InProgress {
                        score -= 10;
                    }
                    score -= 20;
                }
            }
        }
        if state.players[0].marker == Marker::X {
            score
        } else {
            -score
        }
    }
}
