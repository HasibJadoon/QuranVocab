export enum SubscriptionMode {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH'
}

export const SUBSCRIPTION_MODES: Array<string> = Object.keys(SubscriptionMode).map((k) => SubscriptionMode[k]);
