import { ScenarioRegistry } from "../scenarios/ScenarioRegistry";
import { type GameState } from "@shared/types/GameState";
import { buildRegionIndex } from "@shared/utils/buildRegionIndex";
import { updateAllRegionsAndAggregate } from "@shared/utils/aggregateCountryData";
import { generateInitialMapFeatures } from "../scenarios/generateMapFeatures";
import { RegionEconomyService } from "../services/RegionEconomyService";

export function createGame(
  scenarioId: keyof typeof ScenarioRegistry,
  playerCountryId: string
): GameState {
  const scenario = ScenarioRegistry[scenarioId];
  const regions = structuredClone(scenario.regions);
  const countries = structuredClone(scenario.countries);

  // Инициализируем региональную экономику
  const regionEconomyService = new RegionEconomyService();
  for (const region of regions) {
    regionEconomyService.initializeRegionEconomy(region);
  }

  // Инициализируем ВВП регионов и агрегируем данные к странам
  updateAllRegionsAndAggregate(countries, regions);

  // Создаём базовое состояние игры
  const game: GameState = {
    currentDate: scenario.startDate,
    playerCountryId,
    era: structuredClone(scenario.technologyEra),
    countries,
    regions,
    regionIndex: buildRegionIndex(regions),
    playerActions: [],
    eventHistory: [],
    mapFeatures: []
  };

  // Генерируем начальные Map Features
  game.mapFeatures = generateInitialMapFeatures(game);

  return game;
}