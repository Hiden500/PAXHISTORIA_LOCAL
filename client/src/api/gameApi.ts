import { type GameState } from "@shared/types/GameState";
import { type ScenarioInfo } from "@shared/types/ScenarioInfo";

const API = "";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getScenarios(): Promise<ScenarioInfo[]> {
  const response = await fetch(`${API}/scenarios/list`);
  return handleResponse(response);
}

export async function startGame(
  scenarioId: string,
  playerCountryId: string
): Promise<GameState> {
  const response = await fetch(`${API}/game/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId, playerCountryId }),
  });
  return handleResponse(response);
}

export async function getGameState(): Promise<GameState> {
  const response = await fetch(`${API}/game/state`);
  return handleResponse(response);
}

export async function nextTurn(): Promise<GameState> {
  const response = await fetch(`${API}/game/next-turn`, {
    method: "POST",
  });
  return handleResponse(response);
}
