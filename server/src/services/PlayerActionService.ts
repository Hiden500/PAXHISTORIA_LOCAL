import { type GameState } from "@shared/types/GameState";
import { type PlayerAction } from "@shared/types/actions/PlayerAction";
import { type PlayerActionInput } from "../validation/schemas";
import { GameError } from "../errors/AppError";

const TITLES: Record<string, string> = {
  build_factory: "Строительство завода",
  build_mine: "Строительство шахты",
  build_infrastructure: "Строительство инфраструктуры",
  recruit_units: "Набор подразделений"
};

const DESCRIPTIONS: Record<string, string> = {
  build_factory: "Строительство нового промышленного предприятия",
  build_mine: "Разработка нового месторождения ресурсов",
  build_infrastructure: "Улучшение инфраструктуры региона",
  recruit_units: "Формирование новых военных подразделений"
};

/**
 * Сервис для управления действиями игрока.
 */
export class PlayerActionService {
  /**
   * Создаёт и регистрирует новое действие игрока.
   */
  createAction(game: GameState, action: PlayerActionInput): PlayerAction {
    const newAction: PlayerAction = {
      id: `action-${Date.now()}`,
      type: action.type,
      regionId: action.regionId,
      title: TITLES[action.type] || "Действие",
      description: DESCRIPTIONS[action.type] || "",
      createdAt: new Date().toISOString(),
      ...(action.parameters ? { parameters: action.parameters } : {})
    };

    game.playerActions.push(newAction);
    return newAction;
  }

  /**
   * Удаляет действие игрока по ID. Бросает GameError, если не найдено.
   */
  deleteAction(game: GameState, actionId: string): void {
    const actionIndex = game.playerActions.findIndex(a => a.id === actionId);
    if (actionIndex === -1) {
      throw new GameError("Action not found");
    }

    game.playerActions.splice(actionIndex, 1);
  }
}
