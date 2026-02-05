export enum SlotType {
  FREE = 'free',
  DAY = 'day',
  HALF_DAY = 'half_day',
  CUSTOM = 'custom'
}

export const SLOT_TYPES = Object.keys(SlotType).map((k) => SlotType[k]);
