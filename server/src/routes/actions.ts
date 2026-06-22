import express from "express";
import { PlayerActionService } from "../services/PlayerActionService";
import { playerActionSchema } from "../validation/schemas";
import { ValidationError, GameError } from "../errors/AppError";
import { getGame, setGame } from "../game/GameStore";

const router = express.Router();
const playerActionService = new PlayerActionService();

/**
 * Создаёт новое действие игрока.
 */
router.post("/", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    // Валидация входных данных
    const validationResult = playerActionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Invalid action input", validationResult.error.issues);
    }

    const action = validationResult.data;

    const newAction = playerActionService.createAction(game, action);

    setGame(game);
    res.json({ success: true, action: newAction });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, details: error.details });
    } else if (error instanceof GameError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * Получает список действий игрока.
 */
router.get("/", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    res.json(game.playerActions);
  } catch (error) {
    if (error instanceof GameError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * Удаляет действие игрока по ID.
 */
router.delete("/:id", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    const { id } = req.params;
    playerActionService.deleteAction(game, id);
    setGame(game);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof GameError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
