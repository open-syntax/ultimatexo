use ultimatexo_ai::{MinimaxAI, Move};
use ultimatexo_core::{AppError, GameEngine, Marker};

pub struct GameAIService;

impl GameAIService {
    pub async fn apply_ai_move(game: &mut GameEngine, ai_player: Marker) -> Result<(), AppError> {
        if let Some(ai_move) = Self::get_ai_move(game, ai_player).await
            && game
                .make_move([ai_move.board_index, ai_move.cell_index])
                .is_ok()
        {
            return Ok(());
        }
        Err(AppError::ai_move_failed())
    }

    async fn get_ai_move(game: &GameEngine, ai_player: Marker) -> Option<Move> {
        let ai = MinimaxAI::new(game.state.difficulty as usize);
        ai.find_best_move_parallel(&game.state, ai_player).await
    }
}
