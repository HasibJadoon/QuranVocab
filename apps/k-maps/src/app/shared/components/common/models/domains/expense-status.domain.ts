export enum ExpenseStatus {
  // Statut à la création de la note de frais
  SUB = 'SUB',
  // Statut permettant d’indiquer qu’il manque des éléments pour que la note de frais soit validée
  PEN = 'PEN',
  // Statut permettant d’indiquer que la note de frais a été validée
  VAL = 'VAL',
  // Statut permettant d’indiquer que la note de frais a été rejetée
  REJ = 'REJ'
}

export const EXPENSE_STATUS = Object.values(ExpenseStatus);
