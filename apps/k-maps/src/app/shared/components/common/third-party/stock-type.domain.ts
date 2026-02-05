export enum StockType {
  SMGV = 'SMGV',
  SMAV = 'SMAV',
  STKF = 'STKF',
  STCU = 'STCU',
  STKC = 'STKC',
  STCO = 'STCO',
  STFL = 'STFL',
  STLO = 'STLO'
}

export const STOCK_TYPES = Object.keys(StockType).map((k) => StockType[k]);

export const STOCK_SEQUENCE: { [key: string]: number } = {
  [StockType.SMGV]: 1,
  [StockType.SMAV]: 2,
  [StockType.STKF]: 4,
  [StockType.STFL]: 5,
  [StockType.STCU]: 6,
  [StockType.STLO]: 7,
  [StockType.STCO]: 8,
  [StockType.STKC]: 9
};
