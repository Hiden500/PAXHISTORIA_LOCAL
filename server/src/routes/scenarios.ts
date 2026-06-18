import express from "express";
import { ScenarioRegistry } from "../scenarios/ScenarioRegistry";
import { type ScenarioInfo } from "@shared/types/ScenarioInfo";

const router = express.Router();

router.get("/list", (_req, res) => {
  const scenarios: ScenarioInfo[] = Object.values(ScenarioRegistry)
    .filter(scenario => scenario.countries.length > 0)
    .map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      startDate: scenario.startDate,
      endDate: scenario.endDate,
      description: scenario.description,
      era: scenario.technologyEra.name,
      featuredCountries: scenario.countries.map(c => c.id),
    }));

  res.json(scenarios);
});

export default router;
