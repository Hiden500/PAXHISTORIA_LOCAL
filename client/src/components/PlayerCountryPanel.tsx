import { type Country } from "@shared/types/Country";
import { ResourceType } from "@shared/types/resources/ResourcesType";

interface Props {
  country: Country;
}

const RESOURCE_LABELS: Partial<Record<ResourceType, string>> = {
  [ResourceType.Aluminum]: "Алюминий",
  [ResourceType.Bauxite]: "Бокситы",
  [ResourceType.Coal]: "Уголь",
  [ResourceType.Copper]: "Медь",
  [ResourceType.Food]: "Пища",
  [ResourceType.Gas]: "Газ",
  [ResourceType.Iron]: "Железо",
  [ResourceType.Gold]: "Золото",
  [ResourceType.Oil]: "Нефть",
  [ResourceType.Lithium]: "Литий",
  [ResourceType.RareEarths]: "Редкие металлы",
  [ResourceType.Timber]: "Древесина",
  [ResourceType.Uranium]: "Уран",
};

export function PlayerCountryPanel({ country }: Props) {
  const activeProjects = country.technology.projects.filter(p => !p.completed);
  const stockpileEntries = Object.entries(country.stockpile).filter(
    ([, amount]) => amount > 0
  );

  return (
    <div className="player-panel">
      <h2>{country.name}</h2>

      <dl className="stat-list">
        <div>
          <dt>Население</dt>
          <dd>{country.population.toLocaleString("ru-RU")}</dd>
        </div>
        <div>
          <dt>ВВП</dt>
          <dd>{Math.round(country.economy.gdp).toLocaleString("ru-RU")}</dd>
        </div>
        <div>
          <dt>Казна</dt>
          <dd>{Math.round(country.economy.treasury).toLocaleString("ru-RU")}</dd>
        </div>
        <div>
          <dt>Бюджет</dt>
          <dd className={country.economy.budgetBalance >= 0 ? "positive" : "negative"}>
            {Math.round(country.economy.budgetBalance).toLocaleString("ru-RU")}
          </dd>
        </div>
        <div>
          <dt>Инфляция</dt>
          <dd>{country.economy.inflation.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Безработица</dt>
          <dd>{country.economy.unemployment.toFixed(1)}%</dd>
        </div>
      </dl>

      {country.researchedTechnologyIds.length > 0 && (
        <section className="panel-section">
          <h3>Технологии</h3>
          <ul>
            {country.researchedTechnologyIds.map(id => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </section>
      )}

      {activeProjects.length > 0 && (
        <section className="panel-section">
          <h3>Активные проекты</h3>
          <p>{activeProjects.length}</p>
        </section>
      )}

      {stockpileEntries.length > 0 && (
        <section className="panel-section">
          <h3>Ресурсы</h3>
          <ul className="resource-list">
            {stockpileEntries.map(([resource, amount]) => (
              <li key={resource}>
                {RESOURCE_LABELS[resource as ResourceType] ?? resource}:{" "}
                {Math.round(amount).toLocaleString("ru-RU")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
