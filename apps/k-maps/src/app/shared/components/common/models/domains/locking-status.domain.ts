/**
 * Status du blocage
 */
export enum LockingStatus {
  /**
   * * A appliquer
   * */
  TA = 'TA',
  /**
   * * En cours
   * */
  IP = 'IP',
  /**
   * * Terminé
   * */
  EX = 'EX',
  /**
   * * Refusé
   * */
  RE = 'RE',
  /**
   * * Annulé
   * */
  CA = 'CA'
}

export const LOCKING_STATUS: Array<string> = Object.keys(LockingStatus).map((k) => LockingStatus[k]);
