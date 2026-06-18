import express from "express";
import { getGame } from "../game/GameStore";

const router = express.Router();

router.post("/action", (req, res) => {
  const game = getGame();
  if (!game) {
    res.status(404).json({ error: "No active game" });
    return;
  }

  game.playerActions.push(req.body);
  res.json({ success: true });
});

export default router;
