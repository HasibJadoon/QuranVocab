/**
 * Status de la pod
 */
export enum PodStatus {
  /**
   * To check
   */
  TOC = 'TOC',
  /**
   * Checked
   */
  CHE = 'CHE'
}

export const POD_STATUS: Array<string> = Object.keys(PodStatus).map((k) => PodStatus[k]);
