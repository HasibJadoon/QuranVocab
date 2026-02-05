export enum StartEvent {
  MAD = 'MAD',
  ORDER_CREATE = 'ORDER_CREATE',
  PICKUP = 'PICKUP'
}

export const START_EVENTS = Object.keys(StartEvent).map((k) => StartEvent[k]);
