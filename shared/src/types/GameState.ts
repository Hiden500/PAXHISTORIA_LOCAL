import { type Country } from "../types/Country";
import { type Region } from "./map/Region";
import { type Event } from "../types/Event";
import { type PlayerAction } from "../types/actions/PlayerAction";
import { type EraDefinition } from "../types/research/EraDefinition";
import { type MapFeature } from "./map/MapFeature";

export interface GameState {
  currentDate: string;

  playerCountryId: string;

  countries: Country[];

  era: EraDefinition;

  regions: Region[];

  regionIndex: Map<string, number[]>;

  playerActions: PlayerAction[];

  eventHistory: Event[];

  mapFeatures: MapFeature[];

  // LLM Simulation fields
  llmContext?: string; // контекст для LLM (промт)
  llmResponse?: string; // последний ответ LLM
  llmTurn?: number; // номер хода для LLM симуляции
  pendingLlmActions?: LLMAction[]; // действия от LLM ожидающие применения
}

export interface LLMAction {
  type: 'diplomacy' | 'war' | 'peace' | 'annex' | 'puppet' | 'sanction' | 'guarantee' | 'influence';
  sourceCountryId: string;
  targetCountryId?: string;
  data?: Record<string, any>;
}