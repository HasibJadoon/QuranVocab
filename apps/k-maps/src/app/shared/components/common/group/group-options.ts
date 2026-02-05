export interface IGroupOption {
  nameKey: string;
  value: string;
  sort?: (value: boolean) => string;
  transform?: (value: any) => string;
  transformDescription?: (value: any) => string;
  nulls_last: boolean;
  filter: (_id: any) => Record<string, any>;
}

export interface IGroup {
  key: string;
  direction: GroupDirection;
  nullsLast: boolean;
}

export enum GroupDirection {
  UP = 'UP',
  DOWN = 'DOWN'
}
