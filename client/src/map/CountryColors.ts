import type { Country } from '@shared/types/Country';

/**
 * Создает карту цветов стран из игровых данных
 */
export function createCountryColorMap(countries: Country[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  
  countries.forEach(country => {
    colorMap.set(country.id, country.color);
  });

  return colorMap;
}

/**
 * Стандартные цвета для нейтральных территорий
 */
export const NEUTRAL_COLOR = '#808080';
export const SELECTED_COLOR = '#FFD700';
export const HOVER_COLOR = '#FFFFFF';