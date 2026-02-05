/**
 * Status de la prise de RDV
 */
export enum AppointmentStatus {
  /**
   * A notifier
   */
  TON = 'TON',
  /**
   * Notifié
   */
  NOT = 'NOT',
  /**
   * RDV pris
   */
  DON = 'DON',
  /**
   * RDV annulé
   */
  CAN = 'CAN'
}

export const APPOINTMENT_STATUS: Array<string> = Object.keys(AppointmentStatus).map((k) => AppointmentStatus[k]);

export function minAppointmentStatus(a: AppointmentStatus, b: AppointmentStatus): AppointmentStatus {
  if (a == null && b == null) {
    return null;
  }
  if (a == null) {
    return b;
  }
  if (b == null) {
    return a;
  }
  if (a === AppointmentStatus.TON || b === AppointmentStatus.TON) {
    return AppointmentStatus.TON;
  }
  if (a === AppointmentStatus.NOT || b === AppointmentStatus.NOT) {
    return AppointmentStatus.NOT;
  }
  if (a === AppointmentStatus.DON || b === AppointmentStatus.DON) {
    return AppointmentStatus.DON;
  }
  return AppointmentStatus.CAN;
}
