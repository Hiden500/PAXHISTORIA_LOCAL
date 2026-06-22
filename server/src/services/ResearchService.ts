import { type Country } from "@shared/types/Country";
import { type ResearchProject } from "@shared/types/research/ResearchProject";
import { ValidationError, GameError } from "../errors/AppError";

/**
 * Сервис для управления исследованиями страны.
 */
export class ResearchService {
  /**
   * Запускает исследование технологии. Бросает ValidationError, если технология
   * уже исследуется или уже исследована.
   */
  startProject(country: Country, technologyId: string): ResearchProject {
    const existingProject = country.technology.projects.find(p => p.technologyId === technologyId);
    if (existingProject) {
      throw new ValidationError("Project already being researched");
    }

    if (country.researchedTechnologyIds.includes(technologyId)) {
      throw new ValidationError("Technology already researched");
    }

    const newProject: ResearchProject = {
      id: `project-${Date.now()}`,
      technologyId,
      name: `Research ${technologyId}`,
      domain: "Research",
      progress: 0,
      requiredProgress: 100,
      progressPerMonth: 10,
      cost: country.economy.researchSpending,
      requiredTechnologyIds: [],
      requiredResources: {},
      startDate: new Date().toISOString(),
      estimatedMonths: 10,
      completed: false
    };

    country.technology.projects.push(newProject);
    return newProject;
  }

  /**
   * Останавливает (удаляет) исследование по ID проекта. Бросает GameError, если не найдено.
   */
  stopProject(country: Country, projectId: string): void {
    const projectIndex = country.technology.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      throw new GameError("Project not found");
    }

    country.technology.projects.splice(projectIndex, 1);
  }

  /**
   * Возвращает список активных исследований страны.
   */
  getActiveProjects(country: Country): ResearchProject[] {
    return country.technology.projects;
  }

  /**
   * Возвращает сводное состояние технологий страны.
   */
  getTechnologyState(country: Country): {
    domains: Record<string, number>;
    researchedIds: string[];
    projects: ResearchProject[];
  } {
    return {
      domains: country.technology.domains,
      researchedIds: country.researchedTechnologyIds,
      projects: country.technology.projects
    };
  }
}
