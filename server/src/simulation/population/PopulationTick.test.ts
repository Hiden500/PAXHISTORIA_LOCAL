import { describe, it, expect } from "vitest";
import { populationTick } from "./PopulationTick";
import { createTestCountry, createTestRegion } from "../../test-utils/fixtures";

describe("populationTick", () => {
  it("grows region population when births exceed deaths", () => {
    const country = createTestCountry();
    const region = createTestRegion({ ownerCountryId: country.id, population: 1_000_000, stability: 80 });
    const populationBefore = region.population;

    populationTick(country, [region]);

    expect(region.population).toBeGreaterThan(populationBefore);
  });

  it("is deterministic for identical inputs", () => {
    const countryA = createTestCountry();
    const countryB = createTestCountry();
    const regionA = createTestRegion({ ownerCountryId: countryA.id });
    const regionB = createTestRegion({ ownerCountryId: countryB.id });

    populationTick(countryA, [regionA]);
    populationTick(countryB, [regionB]);

    expect(regionA.population).toBe(regionB.population);
  });

  it("never drops region population below the 1000 floor", () => {
    const country = createTestCountry({
      economy: { ...createTestCountry().economy, gdp: 1, educationSpending: 0, welfareSpending: 0 },
    });
    const region = createTestRegion({ ownerCountryId: country.id, population: 500, stability: 0 });

    populationTick(country, [region]);

    expect(region.population).toBeGreaterThanOrEqual(1000);
  });

  it("ignores regions owned by other countries", () => {
    const country = createTestCountry();
    const foreignRegion = createTestRegion({ ownerCountryId: "OTHER" });
    const populationBefore = foreignRegion.population;

    populationTick(country, [foreignRegion]);

    expect(foreignRegion.population).toBe(populationBefore);
  });

  it("does not throw when the country owns no regions", () => {
    const country = createTestCountry();

    expect(() => populationTick(country, [])).not.toThrow();
  });
});
