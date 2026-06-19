import express from "express";
import { getGame } from "../game/GameStore";
import { playerActionSchema } from "../validation/schemas";
import { ValidationError, GameError } from "../errors/AppError";
import { type PlayerAction } from "@shared/types/actions/PlayerAction";

const router = express.Router();

router.post("/action", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    const validationResult = playerActionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Invalid action input", validationResult.error.issues);
    }

    const validated = validationResult.data;
    const action: PlayerAction = {
      id: `action-${Date.now()}`,
      type: validated.type,
      regionId: validated.regionId,
      title: validated.type,
      description: "",
      ...(validated.parameters ? { parameters: validated.parameters } : {}),
    };

    game.playerActions.push(action);
    res.json({ success: true });
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

export default router;
