# Архитектура проекта

## Структура

client/
server/
shared/
docs/

---

## Shared

### Country

Содержит:

* EconomyState
* TechnologyState
* MilitaryState
* DiplomacyState
* PoliticalState

### Region

Основная территориальная единица.

Поля:

* id
* ownerId
* population
* infrastructure
* stability
* resources
* developmentLevel
* neighbours

### EconomyState

Поля:

* gdp
* treasury
* budgetIncome
* budgetExpenses
* inflation
* unemployment
* debt

### TechnologyState

Поля:

* domains
* projects
* researchPoints

### MilitaryState

Поля:

* manpower
* armies
* fleets
* airForces
* equipment

### DiplomacyState

Поля:

* relations
* alliances
* guarantees
* sanctions

---

## Server

Сервер выполняет симуляцию мира.

Тики выполняются последовательно.

---

## Client

Отвечает за интерфейс, карту и отображение состояния мира.
