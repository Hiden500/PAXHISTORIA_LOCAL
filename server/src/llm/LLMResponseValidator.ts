import { type GameState } from "@shared/types/GameState";
import { type LLMAction } from "@shared/types/GameState";

/**
 * Валидатор ответов от LLM.
 * Проверяет структуру и корректность данных в ответе LLM.
 */
export class LLMResponseValidator {
  private game: GameState;

  constructor(game: GameState) {
    this.game = game;
  }

  /**
   * Валидирует полный ответ от LLM.
   */
  validateResponse(response: string): {
    valid: boolean;
    error?: string;
    parsedData?: {
      descriptions: string;
      actions: LLMAction[];
    };
  } {
    try {
      const parsed = JSON.parse(response);

      // Проверяем наличие обязательных полей
      if (!parsed.descriptions) {
        return { valid: false, error: 'Missing descriptions field' };
      }

      if (!parsed.actions || !Array.isArray(parsed.actions)) {
        return { valid: false, error: 'Missing or invalid actions field' };
      }

      // Валидируем каждое действие
      for (const action of parsed.actions) {
        const actionValidation = this.validateAction(action);
        if (!actionValidation.valid) {
          return { valid: false, error: `Invalid action: ${actionValidation.error}` };
        }
      }

      return {
        valid: true,
        parsedData: {
          descriptions: parsed.descriptions,
          actions: parsed.actions,
        },
      };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Валидирует отдельное действие.
   */
  validateAction(action: any): { valid: boolean; error?: string } {
    if (!action.type) {
      return { valid: false, error: 'Missing type field' };
    }

    const validTypes = ['diplomacy', 'war', 'peace', 'annex', 'puppet', 'sanction', 'guarantee', 'influence'];
    if (!validTypes.includes(action.type)) {
      return { valid: false, error: `Invalid type: ${action.type}` };
    }

    if (!action.sourceCountryId) {
      return { valid: false, error: 'Missing sourceCountryId field' };
    }

    // Проверяем, что страна-источник существует
    const sourceCountry = this.game.countries.find(c => c.id === action.sourceCountryId);
    if (!sourceCountry) {
      return { valid: false, error: `Source country not found: ${action.sourceCountryId}` };
    }

    // Для некоторых типов действий нужна целевая страна
    if (['diplomacy', 'war', 'peace', 'sanction', 'guarantee', 'influence', 'annex', 'puppet'].includes(action.type)) {
      if (!action.targetCountryId) {
        return { valid: false, error: `Missing targetCountryId for action type: ${action.type}` };
      }

      const targetCountry = this.game.countries.find(c => c.id === action.targetCountryId);
      if (!targetCountry) {
        return { valid: false, error: `Target country not found: ${action.targetCountryId}` };
      }
    }

    return { valid: true };
  }

  /**
   * Валидирует, что действие применимо в текущем состоянии игры.
   */
  validateActionApplicability(action: LLMAction): { valid: boolean; error?: string } {
    const source = this.game.countries.find(c => c.id === action.sourceCountryId);
    if (!source) {
      return { valid: false, error: 'Source country not found' };
    }

    if (action.targetCountryId) {
      const target = this.game.countries.find(c => c.id === action.targetCountryId);
      if (!target) {
        return { valid: false, error: 'Target country not found' };
      }

      // Проверяем логические ограничения
      if (action.type === 'peace') {
        // Нельзя заключить мир если уже нет войны
        // В будущем нужно проверять наличие войны
      }

      if (action.type === 'sanction') {
        // Нельзя наложить санкции если уже есть
        const existingSanctions = source.diplomacy.sanctions[action.targetCountryId];
        if (existingSanctions && existingSanctions.length > 0) {
          return { valid: false, error: 'Sanctions already exist' };
        }
      }

      if (action.type === 'guarantee') {
        // Нельзя гарантировать независимость если уже есть гарантия
        if (source.diplomacy.guarantees.includes(action.targetCountryId)) {
          return { valid: false, error: 'Guarantee already exists' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Фильтрует валидные действия из списка.
   */
  filterValidActions(actions: LLMAction[]): LLMAction[] {
    const validActions: LLMAction[] = [];

    for (const action of actions) {
      const validation = this.validateAction(action);
      if (!validation.valid) {
        console.warn(`Invalid action: ${validation.error}`);
        continue;
      }

      const applicability = this.validateActionApplicability(action);
      if (!applicability.valid) {
        console.warn(`Action not applicable: ${applicability.error}`);
        continue;
      }

      validActions.push(action);
    }

    return validActions;
  }
}
