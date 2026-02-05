export interface Currency {
  code: string;
  symbol: string;
  icon_name: string;
  value_in_euro: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', icon_name: 'fa-euro-sign', value_in_euro: 1 },
  { code: 'GBP', symbol: '£', icon_name: 'fa-pound-sign', value_in_euro: 1.12 }, // MAJ le 11/06/2019
  { code: 'USD', symbol: '$', icon_name: 'fa-dollar-sign', value_in_euro: 0.86 } // MAJ le 16/07/2025
];
