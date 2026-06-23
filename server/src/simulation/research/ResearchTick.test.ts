import { describe, it, expect } from "vitest";
import { researchTick } from "./ResearchTick";
import { createTestCountry, createTestRegion, createTestResearchProject } from "../../test-utils/fixtures";

describe("researchTick", () => {
  it("advances progress on an eligible project", () => {
    const project = createTestResearchProject({ progress: 0, requiredProgress: 1_000_000 });
    const country = createTestCountry({ technology: { domains: {}, projects: [project] } });

    researchTick(country, []);

    expect(country.technology.projects[0]!.progress).toBeGreaterThan(0);
  });

  it("skips projects whose required technologies are not yet researched", () => {
    const project = createTestResearchProject({ requiredTechnologyIds: ["prerequisite"], requiredProgress: 1_000_000 });
    const country = createTestCountry({ technology: { domains: {}, projects: [project] } });

    researchTick(country, []);

    expect(country.technology.projects[0]!.progress).toBe(0);
  });

  it("skips projects whose required resources are not in stock", () => {
    const project = createTestResearchProject({ requiredResources: { uranium: 1_000_000_000 }, requiredProgress: 1_000_000 });
    const country = createTestCountry({ technology: { domains: {}, projects: [project] } });

    researchTick(country, []);

    expect(country.technology.projects[0]!.progress).toBe(0);
  });

  it("completes a project, unlocks its domain level, and removes it from the active list once requiredProgress is reached", () => {
    const project = createTestResearchProject({ domain: "Industry", progress: 90, requiredProgress: 100, progressPerMonth: 1000 });
    const country = createTestCountry({ technology: { domains: {}, projects: [project] } });

    researchTick(country, []);

    expect(country.technology.projects).toHaveLength(0);
    expect(country.technology.domains.Industry).toBe(1);
    expect(country.researchedTechnologyIds).toContain(project.id);
  });

  it("gives a bonus for regions with high development (research centers)", () => {
    const lowDevProject = createTestResearchProject({ requiredProgress: 1_000_000 });
    const lowDevCountry = createTestCountry({ id: "LOW", technology: { domains: {}, projects: [lowDevProject] } });
    const lowDevRegion = createTestRegion({ ownerCountryId: "LOW", development: 0.3 });

    const highDevProject = createTestResearchProject({ requiredProgress: 1_000_000 });
    const highDevCountry = createTestCountry({ id: "HIGH", technology: { domains: {}, projects: [highDevProject] } });
    const highDevRegion = createTestRegion({ ownerCountryId: "HIGH", development: 0.9 });

    researchTick(lowDevCountry, [lowDevRegion]);
    researchTick(highDevCountry, [highDevRegion]);

    expect(highDevCountry.technology.projects[0]!.progress).toBeGreaterThan(lowDevCountry.technology.projects[0]!.progress);
  });
});
