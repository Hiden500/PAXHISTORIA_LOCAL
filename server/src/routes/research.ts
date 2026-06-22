import express from "express";
import { CountryService } from "../services/CountryService";
import { ResearchService } from "../services/ResearchService";
import { startResearchSchema } from "../validation/schemas";
import { ValidationError, GameError, CountryError } from "../errors/AppError";
import { getGame, setGame } from "../game/GameStore";

const router = express.Router();
const countryService = new CountryService();
const researchService = new ResearchService();

/**
 * Запускает исследование технологии.
 */
router.post("/start", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    // Валидация входных данных
    const validationResult = startResearchSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Invalid research input", validationResult.error.issues);
    }

    const { projectId } = validationResult.data;

    // Находим страну игрока
    const playerCountry = countryService.findCountryById(game.countries, game.playerCountryId);
    if (!playerCountry) {
      throw new CountryError("Player country not found");
    }

    const newProject = researchService.startProject(playerCountry, projectId);
    setGame(game);

    res.json({ success: true, project: newProject });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, details: error.details });
    } else if (error instanceof GameError || error instanceof CountryError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * Останавливает исследование.
 */
router.post("/stop/:projectId", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    const { projectId } = req.params;

    const playerCountry = countryService.findCountryById(game.countries, game.playerCountryId);
    if (!playerCountry) {
      throw new CountryError("Player country not found");
    }

    researchService.stopProject(playerCountry, projectId);
    setGame(game);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof GameError || error instanceof CountryError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * Получает список активных исследований.
 */
router.get("/active", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    const playerCountry = countryService.findCountryById(game.countries, game.playerCountryId);
    if (!playerCountry) {
      throw new CountryError("Player country not found");
    }

    res.json(researchService.getActiveProjects(playerCountry));
  } catch (error) {
    if (error instanceof GameError || error instanceof CountryError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * Получает состояние технологий страны.
 */
router.get("/state", (req, res) => {
  try {
    const game = getGame();
    if (!game) {
      throw new GameError("No active game");
    }

    const playerCountry = countryService.findCountryById(game.countries, game.playerCountryId);
    if (!playerCountry) {
      throw new CountryError("Player country not found");
    }

    res.json(researchService.getTechnologyState(playerCountry));
  } catch (error) {
    if (error instanceof GameError || error instanceof CountryError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
