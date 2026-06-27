import { EconomyType } from "@shared/types/EconomyType";
import { type EconomyProfile } from "@shared/types/EconomyProfile";

/**
 * Дефолтные экономические профили по EconomyType. Стартовые предложения —
 * не историческая истина, тюнингуются на симуляции (см. docs/ECONOMY.md,
 * docs/DECISIONS.md 2026-06-26). Дают новой стране осмысленный профиль без
 * ручного авторинга всех полей — основа для упрощения подключения стран
 * (см. docs/TODO.md).
 */
export const ECONOMY_ARCHETYPES: Record<EconomyType, EconomyProfile> = {
  [EconomyType.Planned]: {
    taxRate: 0.20,
    spending: {
      military: 0.30,
      research: 0.08,
      education: 0.10,
      infrastructure: 0.25,
      welfare: 0.12,
      other: 0.10,
    },
    treasuryShare: 0.05,
    exportShare: 0.03,
    stateEnterpriseShare: 0.10,
    otherIncomeShare: 0.01,
    inflation: 2,
    unemployment: 1,
    tradeBalance: 0,
  },
  [EconomyType.Mixed]: {
    taxRate: 0.15,
    spending: {
      military: 0.20,
      research: 0.08,
      education: 0.15,
      infrastructure: 0.20,
      welfare: 0.22,
      other: 0.10,
    },
    treasuryShare: 0.05,
    exportShare: 0.05,
    stateEnterpriseShare: 0.03,
    otherIncomeShare: 0.02,
    inflation: 3,
    unemployment: 4,
    tradeBalance: 0,
  },
  [EconomyType.Market]: {
    taxRate: 0.10,
    spending: {
      military: 0.15,
      research: 0.10,
      education: 0.15,
      infrastructure: 0.15,
      welfare: 0.30,
      other: 0.10,
    },
    treasuryShare: 0.04,
    exportShare: 0.06,
    stateEnterpriseShare: 0.01,
    otherIncomeShare: 0.02,
    inflation: 2,
    unemployment: 5,
    tradeBalance: 0,
  },
};
