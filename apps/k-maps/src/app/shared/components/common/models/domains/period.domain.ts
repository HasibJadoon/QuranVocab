/**
 * Période horaire
 */
export enum Period {
  // Matin
  MORNING = 'MORNING',
  // Après midi
  AFTERNOON = 'AFTERNOON'
}

export const PERIODS = Object.keys(Period).map((k) => Period[k]);
