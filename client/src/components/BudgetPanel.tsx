import { useState } from "react";
import { type Country } from "@shared/types/Country";

interface BudgetFormState {
  militarySpending: number;
  researchSpending: number;
  educationSpending: number;
  infrastructureSpending: number;
  welfareSpending: number;
}

interface Props {
  country: Country;
  onUpdateBudget: (budget: BudgetFormState) => void;
}

function budgetFromCountry(country: Country): BudgetFormState {
  return {
    militarySpending: country.economy.militarySpending,
    researchSpending: country.economy.researchSpending,
    educationSpending: country.economy.educationSpending,
    infrastructureSpending: country.economy.infrastructureSpending,
    welfareSpending: country.economy.welfareSpending,
  };
}

export function BudgetPanel({ country, onUpdateBudget }: Props) {
  const [budget, setBudget] = useState<BudgetFormState>(() => budgetFromCountry(country));

  const setField = (field: keyof BudgetFormState) => (value: number) => {
    setBudget(prev => ({ ...prev, [field]: value }));
  };

  const totalExpenses =
    budget.militarySpending +
    budget.researchSpending +
    budget.educationSpending +
    budget.infrastructureSpending +
    budget.welfareSpending;
  const income =
    country.economy.taxRevenue +
    country.economy.exportIncome +
    country.economy.stateEnterpriseIncome +
    country.economy.otherIncome;
  const balance = income - totalExpenses;

  const handleSave = () => {
    onUpdateBudget(budget);
  };

  const handleReset = () => {
    setBudget(budgetFromCountry(country));
  };

  return (
    <div className="budget-panel">
      <h2>Бюджет</h2>

      <div className="budget-summary">
        <div className="budget-item">
          <span className="label">Доходы:</span>
          <span className="value positive">
            {Math.round(income).toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="budget-item">
          <span className="label">Расходы:</span>
          <span className="value negative">
            {Math.round(totalExpenses).toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="budget-item">
          <span className="label">Баланс:</span>
          <span className={`value ${balance >= 0 ? "positive" : "negative"}`}>
            {Math.round(balance).toLocaleString("ru-RU")}
          </span>
        </div>
      </div>

      <div className="budget-sliders">
        <div className="slider-group">
          <label htmlFor="budget-military">
            Военные расходы: {Math.round(budget.militarySpending).toLocaleString("ru-RU")}
          </label>
          <input
            id="budget-military"
            type="range"
            min="0"
            max={country.economy.gdp * 0.3}
            step={1000}
            value={budget.militarySpending}
            onChange={(e) => setField("militarySpending")(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label htmlFor="budget-research">
            Исследования: {Math.round(budget.researchSpending).toLocaleString("ru-RU")}
          </label>
          <input
            id="budget-research"
            type="range"
            min="0"
            max={country.economy.gdp * 0.2}
            step={1000}
            value={budget.researchSpending}
            onChange={(e) => setField("researchSpending")(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label htmlFor="budget-education">
            Образование: {Math.round(budget.educationSpending).toLocaleString("ru-RU")}
          </label>
          <input
            id="budget-education"
            type="range"
            min="0"
            max={country.economy.gdp * 0.2}
            step={1000}
            value={budget.educationSpending}
            onChange={(e) => setField("educationSpending")(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label htmlFor="budget-infrastructure">
            Инфраструктура: {Math.round(budget.infrastructureSpending).toLocaleString("ru-RU")}
          </label>
          <input
            id="budget-infrastructure"
            type="range"
            min="0"
            max={country.economy.gdp * 0.15}
            step={1000}
            value={budget.infrastructureSpending}
            onChange={(e) => setField("infrastructureSpending")(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label htmlFor="budget-welfare">
            Социальные программы: {Math.round(budget.welfareSpending).toLocaleString("ru-RU")}
          </label>
          <input
            id="budget-welfare"
            type="range"
            min="0"
            max={country.economy.gdp * 0.15}
            step={1000}
            value={budget.welfareSpending}
            onChange={(e) => setField("welfareSpending")(Number(e.target.value))}
          />
        </div>
      </div>

      {balance < 0 && (
        <div className="budget-warning" role="alert">
          ⚠️ Дефицит бюджета: {Math.round(Math.abs(balance)).toLocaleString("ru-RU")}
        </div>
      )}

      <div className="budget-actions">
        <button onClick={handleReset}>Сбросить</button>
        <button onClick={handleSave} className="primary">
          Сохранить
        </button>
      </div>
    </div>
  );
}
