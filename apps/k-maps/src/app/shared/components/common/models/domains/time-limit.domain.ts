export enum TimeLimitType {
  NONE = 'NONE',
  CALENDAR = 'CALENDAR',
  OPEN = 'OPEN',
  WORKING = 'WORKING'
}

export const TIME_LIMIT_TYPES = Object.keys(TimeLimitType).map((k) => TimeLimitType[k]);
