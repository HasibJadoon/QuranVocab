export enum Frequency {
  EVERY_DAY = 'EVERY_DAY',
  EVERY_2_DAYS = 'EVERY_2_DAYS',
  EVERY_WEEK = 'EVERY_WEEK',
  EVERY_2_WEEKS = 'EVERY_2_WEEKS',
  EVERY_3_WEEKS = 'EVERY_3_WEEKS',
  EVERY_4_WEEKS = 'EVERY_4_WEEKS'
}

export const FREQUENCIES = Object.keys(Frequency).map((k) => Frequency[k]);
