import { describe, it, expect } from "vitest";
import { diplomacyTick, calculateBaseInfluence } from "./DiplomacyTick";
import { createTestCountry } from "../../test-utils/fixtures";

describe("diplomacyTick", () => {
  it("decays positive relations toward zero", () => {
    const a = createTestCountry({ id: "A", diplomacy: { ...createTestCountry().diplomacy, relations: { B: 50 } } });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.relations["B"]).toBeLessThan(50);
    expect(a.diplomacy.relations["B"]).toBeGreaterThan(0);
  });

  it("decays negative relations toward zero", () => {
    const a = createTestCountry({ id: "A", diplomacy: { ...createTestCountry().diplomacy, relations: { B: -50 } } });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.relations["B"]).toBeGreaterThan(-50);
    expect(a.diplomacy.relations["B"]).toBeLessThan(0);
  });

  it("decays influence toward zero but never below it", () => {
    const a = createTestCountry({ id: "A", diplomacy: { ...createTestCountry().diplomacy, influence: { B: 40 } } });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.influence["B"]).toBeLessThan(40);
    expect(a.diplomacy.influence["B"]).toBeGreaterThanOrEqual(0);
  });

  it("automatically adds a rival when relations fall below -70", () => {
    const a = createTestCountry({ id: "A", diplomacy: { ...createTestCountry().diplomacy, relations: { B: -75 } } });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.rivals).toContain("B");
  });

  it("automatically adds an ally when relations exceed 70 on both sides and ideologies are compatible", () => {
    const a = createTestCountry({
      id: "A",
      diplomacy: { ...createTestCountry().diplomacy, relations: { B: 75 } },
      politics: { ...createTestCountry().politics, ideology: "democracy" },
    });
    const b = createTestCountry({
      id: "B",
      diplomacy: { ...createTestCountry().diplomacy, relations: { A: 75 } },
      politics: { ...createTestCountry().politics, ideology: "democracy" },
    });

    diplomacyTick([a, b]);

    expect(a.diplomacy.allies).toContain("B");
  });

  it("does not form an alliance when only one side's relation crosses the threshold (regression for the flip-flop bug)", () => {
    // Раньше: одностороннее высокое relation (A->B) приводило к addAlly(),
    // а при обработке B в том же тике его низкое relation (default 0,
    // получившее только половину дельты) немедленно снимало союз через
    // removeAlly — союз создавался и распадался в одном тике. См.
    // docs/DECISIONS.md. Теперь addAlly требует взаимного порога — союз
    // вообще не должен формироваться, пока обе стороны не заинтересованы.
    const a = createTestCountry({
      id: "A",
      diplomacy: { ...createTestCountry().diplomacy, relations: { B: 75 } },
      politics: { ...createTestCountry().politics, ideology: "democracy" },
    });
    const b = createTestCountry({
      id: "B",
      politics: { ...createTestCountry().politics, ideology: "democracy" },
    });

    diplomacyTick([a, b]);

    expect(a.diplomacy.allies).not.toContain("B");
    expect(b.diplomacy.allies).not.toContain("A");
    expect(a.diplomacy.relations["B"]).toBeCloseTo(74.9);
  });

  it("does not add an ally when relations are high but ideologies are incompatible", () => {
    const a = createTestCountry({
      id: "A",
      diplomacy: { ...createTestCountry().diplomacy, relations: { B: 75 } },
      politics: { ...createTestCountry().politics, ideology: "communism" },
    });
    const b = createTestCountry({
      id: "B",
      politics: { ...createTestCountry().politics, ideology: "fascism" },
    });

    diplomacyTick([a, b]);

    expect(a.diplomacy.allies).not.toContain("B");
  });

  it("removes an existing rival once relations recover above -30", () => {
    const a = createTestCountry({
      id: "A",
      diplomacy: { ...createTestCountry().diplomacy, relations: { B: -20 }, rivals: ["B"] },
    });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.rivals).not.toContain("B");
  });

  it("removes an existing ally once relations drop below 30", () => {
    const a = createTestCountry({
      id: "A",
      diplomacy: { ...createTestCountry().diplomacy, relations: { B: 20 }, allies: ["B"] },
    });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.allies).not.toContain("B");
  });

  it("adds a country to the sphere of influence once influence exceeds 50", () => {
    const a = createTestCountry({ id: "A", diplomacy: { ...createTestCountry().diplomacy, influence: { B: 60 } } });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.sphereOfInfluence).toContain("B");
  });

  it("removes a country from the sphere of influence once influence drops below 20", () => {
    const a = createTestCountry({
      id: "A",
      diplomacy: { ...createTestCountry().diplomacy, influence: { B: 10 }, sphereOfInfluence: ["B"] },
    });
    const b = createTestCountry({ id: "B" });

    diplomacyTick([a, b]);

    expect(a.diplomacy.sphereOfInfluence).not.toContain("B");
  });

  it("does not throw for a country with no recorded relations", () => {
    const a = createTestCountry({ id: "A" });

    expect(() => diplomacyTick([a])).not.toThrow();
  });
});

describe("calculateBaseInfluence", () => {
  it("returns a higher value when the source is militarily and economically stronger", () => {
    const strong = createTestCountry({ id: "STRONG" });
    const weak = createTestCountry({
      id: "WEAK",
      military: { ...createTestCountry().military, manpower: 1 },
      economy: { ...createTestCountry().economy, gdp: 1 },
    });

    expect(calculateBaseInfluence(strong, weak)).toBeGreaterThan(calculateBaseInfluence(weak, strong));
  });

  it("caps the result at 100", () => {
    const dominant = createTestCountry({
      id: "DOMINANT",
      military: { ...createTestCountry().military, manpower: 1_000_000_000 },
      economy: { ...createTestCountry().economy, gdp: 1_000_000_000_000_000 },
    });
    const tiny = createTestCountry({
      id: "TINY",
      military: { ...createTestCountry().military, manpower: 1 },
      economy: { ...createTestCountry().economy, gdp: 1 },
    });

    expect(calculateBaseInfluence(dominant, tiny)).toBe(100);
  });
});
