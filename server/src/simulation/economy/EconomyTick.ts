import { type Country } from "@shared/types/Country";
import { type Region } from "@shared/types/map/Region";
import { RegionEconomyService } from "../../services/RegionEconomyService";

/**
 * Обновлённый EconomyTick с использованием регионов и региональной экономики.
 * Рост ВВП на основе промышленности регионов, инфраструктуры и ресурсов.
 *
 * Константы ниже — тюнингуемый баланс, не историческая истина (см.
 * docs/ECONOMY.md, docs/DECISIONS.md 2026-06-26, Q9). Перекалиброваны при
 * переходе на модель "ВВП-якорь + доли": до неё infrastructureSpending/gdp
 * было ≈0 при любом коэффициенте (другой баг масштаба), теперь не ≈0, и
 * старый коэффициент 0.5 давал нереалистичный рост (~20-50%/год). Подбирать
 * на симуляции дальше, не считать текущие значения финальными.
 */
const BASE_GROWTH_INTERCEPT = 0.001;
const BASE_GROWTH_DEVELOPMENT_COEFFICIENT = 0.002;
const BASE_GROWTH_INFRASTRUCTURE_COEFFICIENT = 0.001;
const INFRASTRUCTURE_SPENDING_GROWTH_COEFFICIENT = 0.15;
const DEFICIT_PENALTY_COEFFICIENT = 0.3;
const SECTOR_INDUSTRY_GROWTH_COEFFICIENT = 0.002;
const SECTOR_SERVICES_GROWTH_COEFFICIENT = 0.001;
/** Защитный потолок месячного роста — не даёт архетипу разогнаться неограниченно. */
const MAX_MONTHLY_GROWTH_RATE = 0.05;
const INFLATION_DEFICIT_COEFFICIENT = 0.1;
const UNEMPLOYMENT_DEFICIT_COEFFICIENT = 0.05;

export function economyTick(
  country: Country,
  regions: Region[]
): void {
  const economy = country.economy;
  const countryRegions = regions.filter(r => r.ownerCountryId === country.id);

  // Налоговый доход следует за ВВП: taxRevenue = gdp × ставка (выведена в createGame).
  // taxRate опционально (рантайм-поле): если не задано — taxRevenue остаётся как есть.
  // Остальные компоненты дохода (export/stateEnterprise/other) пока статичны. См. docs/DECISIONS.md.
  if (economy.taxRate !== undefined) {
    economy.taxRevenue = economy.gdp * economy.taxRate;
  }

  const income =
    economy.taxRevenue +
    economy.exportIncome +
    economy.stateEnterpriseIncome +
    economy.otherIncome;

  const expenses =
    economy.militarySpending +
    economy.researchSpending +
    economy.educationSpending +
    economy.infrastructureSpending +
    economy.welfareSpending +
    economy.debtInterest +
    economy.otherExpenses;

  economy.budgetBalance = income - expenses;
  economy.treasury += economy.budgetBalance;

  // Инициализируем региональную экономику если нужно
  const regionEconomyService = new RegionEconomyService();
  for (const region of countryRegions) {
    if (!region.economy) {
      regionEconomyService.initializeRegionEconomy(region);
    }
  }

  // Расчёт роста ВВП на основе регионов
  let avgInfrastructure = 0;
  let avgDevelopment = 0;

  if (countryRegions.length > 0) {
    avgInfrastructure = countryRegions.reduce((sum, r) => sum + r.infrastructure, 0) / countryRegions.length;
    avgDevelopment = countryRegions.reduce((sum, r) => sum + r.development, 0) / countryRegions.length;
  }

  // Базовый рост на основе среднего развития и инфраструктуры
  const baseGrowthRate =
    BASE_GROWTH_INTERCEPT +
    avgDevelopment * BASE_GROWTH_DEVELOPMENT_COEFFICIENT +
    avgInfrastructure * BASE_GROWTH_INFRASTRUCTURE_COEFFICIENT;

  // Страна без территории (0 регионов, напр. рассинхрон id со сценарием, или
  // будущая полная оккупация в war-системе) имеет gdp=0 — деление даёт NaN,
  // а не ноль. Считаем такую страну экономически инертной за этот тик.
  const hasGdp = economy.gdp > 0;

  // Бонус от инвестиций в инфраструктуру
  const infrastructureBonus = hasGdp
    ? economy.infrastructureSpending / economy.gdp * INFRASTRUCTURE_SPENDING_GROWTH_COEFFICIENT
    : 0;

  // Штраф от дефицита бюджета
  const deficitPenalty = hasGdp && economy.budgetBalance < 0
    ? Math.abs(economy.budgetBalance) / economy.gdp * DEFICIT_PENALTY_COEFFICIENT
    : 0;

  // Итоговый рост, с защитным потолком (см. константы выше)
  const growthRate = Math.min(
    MAX_MONTHLY_GROWTH_RATE,
    Math.max(0, baseGrowthRate + infrastructureBonus - deficitPenalty)
  );

  // Применяем рост к ВВП регионов с учётом экономических секторов
  for (const region of countryRegions) {
    // Регионы с сильной промышленностью растут быстрее
    let sectorBonus = 0;
    if (region.economy) {
      sectorBonus =
        region.economy.industry * SECTOR_INDUSTRY_GROWTH_COEFFICIENT +
        region.economy.services * SECTOR_SERVICES_GROWTH_COEFFICIENT;
    }
    region.gdp *= (1 + growthRate + sectorBonus);
  }

  // ВВП страны обновится через агрегацию в SimulationEngine (aggregateAllCountries,
  // без пересчёта region.gdp — см. shared/src/utils/aggregateCountryData.ts)

  // Инфляция на основе дефицита бюджета и денежной массы
  if (hasGdp) {
    economy.inflation += INFLATION_DEFICIT_COEFFICIENT * (expenses - income) / economy.gdp;

    // Безработица на основе экономического роста
    economy.unemployment += UNEMPLOYMENT_DEFICIT_COEFFICIENT * (expenses - income) / economy.gdp;
    economy.unemployment = Math.max(0, economy.unemployment);
  }
}