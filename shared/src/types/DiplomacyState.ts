export interface DiplomacyState {
  allies: string[];

  rivals: string[];

  puppets: string[];

  sphereOfInfluence: string[];

  relations: Record<string, number>;

  // Новые поля для дипломатии
  influence: Record<string, number>; // влияние на другие страны (0-100)

  guarantees: string[]; // гарантии независимости стран

  sanctions: Record<string, SanctionType[]>; // санкции против стран
}

export type SanctionType =
  | 'trade_embargo'
  | 'economic_sanctions'
  | 'military_sanctions'
  | 'diplomatic_sanctions';