export enum ServicesFormula {
  SERVICES_FIXED = 'SERVICES_FIXED',
  SERVICES_GRID = 'SERVICES_GRID'
}

export enum ServicesFormulaOrder {
  SERVICES_GRID_ORDER = 'SERVICES_GRID_ORDER'
}

export const SERVICES_FORMULAS = Object.keys(ServicesFormula).map((k) => ServicesFormula[k]);

export const SERVICE_AUTO_ORDER_UPDATE_FORMULAS = [ServicesFormulaOrder.SERVICES_GRID_ORDER];
