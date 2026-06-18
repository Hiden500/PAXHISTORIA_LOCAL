/**
 * Информация о сценарии для отображения в UI
 */
export interface ScenarioInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  era: string;
  difficulty?: 'easy' | 'normal' | 'hard';
  featuredCountries: string[];
}