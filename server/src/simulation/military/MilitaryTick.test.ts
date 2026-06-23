import { describe, it, expect } from "vitest";
import { militaryTick } from "./MilitaryTick";
import { createTestCountry, createTestRegion } from "../../test-utils/fixtures";
import { UnitType } from "@shared/types/military/UnitType";

describe("militaryTick", () => {
  it("grows manpower based on owned regions' population", () => {
    const country = createTestCountry();
    const region = createTestRegion({ ownerCountryId: country.id, population: 10_000_000 });
    const manpowerBefore = country.military.manpower;

    militaryTick(country, [region]);

    expect(country.military.manpower).toBeGreaterThan(manpowerBefore);
  });

  it("halves manpower gain when political stability is below 50", () => {
    const stableCountry = createTestCountry({ id: "STABLE", politics: { ...createTestCountry().politics, stability: 80 } });
    const unstableCountry = createTestCountry({ id: "UNSTABLE", politics: { ...createTestCountry().politics, stability: 10 } });
    const stableRegion = createTestRegion({ id: 1, ownerCountryId: "STABLE", population: 10_000_000 });
    const unstableRegion = createTestRegion({ id: 2, ownerCountryId: "UNSTABLE", population: 10_000_000 });

    militaryTick(stableCountry, [stableRegion]);
    militaryTick(unstableCountry, [unstableRegion]);

    const stableGain = stableCountry.military.manpower - createTestCountry().military.manpower;
    const unstableGain = unstableCountry.military.manpower - createTestCountry().military.manpower;

    expect(unstableGain).toBeLessThan(stableGain);
  });

  it("recovers damaged unit strength up to a cap of 100", () => {
    const country = createTestCountry();
    country.military.units = [
      { id: "u1", name: "1st Infantry", type: UnitType.Infantry, strength: 50, experience: 0, regionId: 1 },
    ];

    militaryTick(country, []);

    expect(country.military.units[0]!.strength).toBeGreaterThan(50);
    expect(country.military.units[0]!.strength).toBeLessThanOrEqual(100);
  });

  it("derives activePersonnel and reservePersonnel from manpower", () => {
    const country = createTestCountry();
    const region = createTestRegion({ ownerCountryId: country.id });

    militaryTick(country, [region]);

    expect(country.military.activePersonnel).toBe(Math.floor(country.military.manpower * 0.1));
    expect(country.military.reservePersonnel).toBe(Math.floor(country.military.manpower * 0.9));
  });

  it("does not throw when the country owns no regions", () => {
    const country = createTestCountry();

    expect(() => militaryTick(country, [])).not.toThrow();
  });
});
