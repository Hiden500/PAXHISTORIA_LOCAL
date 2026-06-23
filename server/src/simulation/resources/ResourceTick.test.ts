import { describe, it, expect } from "vitest";
import { resourceTick } from "./ResourceTick";
import { createTestCountry, createTestRegion } from "../../test-utils/fixtures";

describe("resourceTick", () => {
  it("adds extracted resources to the country stockpile", () => {
    const country = createTestCountry();
    const region = createTestRegion({ ownerCountryId: country.id, infrastructure: 0, resourceProduction: { oil: 1000 } });
    const regionIndex = new Map([[country.id, [region.id]]]);
    const oilBefore = country.stockpile.oil;

    resourceTick(country, [region], regionIndex);

    expect(country.stockpile.oil).toBeGreaterThan(oilBefore);
  });

  it("scales extraction with infrastructure", () => {
    const lowInfraCountry = createTestCountry({ id: "LOW" });
    const lowInfraRegion = createTestRegion({ id: 1, ownerCountryId: "LOW", infrastructure: 0, resourceProduction: { oil: 1000 } });

    const highInfraCountry = createTestCountry({ id: "HIGH" });
    const highInfraRegion = createTestRegion({ id: 2, ownerCountryId: "HIGH", infrastructure: 1, resourceProduction: { oil: 1000 } });

    resourceTick(lowInfraCountry, [lowInfraRegion], new Map([["LOW", [1]]]));
    resourceTick(highInfraCountry, [highInfraRegion], new Map([["HIGH", [2]]]));

    const lowGain = lowInfraCountry.stockpile.oil - createTestCountry().stockpile.oil;
    const highGain = highInfraCountry.stockpile.oil - createTestCountry().stockpile.oil;

    expect(highGain).toBeGreaterThan(lowGain);
  });

  it("slightly depletes the region's resource production, with a 10% floor", () => {
    const country = createTestCountry();
    const region = createTestRegion({ ownerCountryId: country.id, resourceProduction: { oil: 1000 } });
    const regionIndex = new Map([[country.id, [region.id]]]);

    resourceTick(country, [region], regionIndex);

    expect(region.resourceProduction.oil).toBeLessThan(1000);
    expect(region.resourceProduction.oil).toBeGreaterThan(100);
  });

  it("only processes regions listed in the regionIndex for that country", () => {
    const country = createTestCountry();
    const ownedRegion = createTestRegion({ id: 1, ownerCountryId: country.id, resourceProduction: { oil: 1000 } });
    const unindexedRegion = createTestRegion({ id: 2, ownerCountryId: country.id, resourceProduction: { oil: 1000 } });
    const regionIndex = new Map([[country.id, [1]]]);

    resourceTick(country, [ownedRegion, unindexedRegion], regionIndex);

    expect(unindexedRegion.resourceProduction.oil).toBe(1000);
  });

  it("does nothing when the country has no indexed regions", () => {
    const country = createTestCountry();
    const oilBefore = country.stockpile.oil;

    expect(() => resourceTick(country, [], new Map())).not.toThrow();
    expect(country.stockpile.oil).toBe(oilBefore);
  });
});
