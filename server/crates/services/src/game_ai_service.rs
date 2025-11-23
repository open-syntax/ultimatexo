use ultimatexo_ai::MinimaxAI;
use ultimatexo_core::{AppError, GameEngine, Marker};

pub struct GameAIService;

impl GameAIService {
    pub async fn make_ai_move(game: &mut GameEngine, ai_marker: Marker) -> Result<(), AppError> {
        let mut ai = MinimaxAI::with_level(game.state.difficulty).unwrap();
        if let Some(ai_move) = ai.find_best_move(&game.state, ai_marker)
            && game
                .make_move([ai_move.board_index, ai_move.cell_index])
                .is_ok()
        {
            return Ok(());
        }
        Err(AppError::ai_move_failed())
    }

    pub async fn make_random_ai_move(game: &mut GameEngine) -> Result<(), AppError> {
        let ai = MinimaxAI::with_level(game.state.difficulty).unwrap();
        if let Some(ai_move) = ai.find_random_move(&game.state)
            && game
                .make_move([ai_move.board_index, ai_move.cell_index])
                .is_ok()
        {
            return Ok(());
        }
        Err(AppError::ai_move_failed())
    }
}
