import { type GameState } from "@shared/types/GameState";
import { type CountryAction } from "../ai/CountryAction";
import { LLMService } from "../services/LLMService";

export function buildSimulationPrompt(
  game: GameState,
  playerActions: string[],
  worldActions: CountryAction[]
): string {
  const llmService = new LLMService(game);
  const basePrompt = llmService.generatePrompt();

  // Добавляем специфические действия игрока и других стран
  const actionsSection = `
## Specific Actions

### Player Actions
${playerActions.join("\n")}

### Other Countries Actions
${worldActions
  .map(a => `${a.countryId}: ${a.description}`)
  .join("\n")}
`;

  return basePrompt + actionsSection;
}