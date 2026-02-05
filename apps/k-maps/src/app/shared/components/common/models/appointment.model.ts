import { ITransition } from './types.model';
import { AppointmentStatus } from './domains/appointment-status.domain';
import { SlotType } from '../contract/slot-type.domain';

export interface IAppointment {
  // Status du RDV
  status: AppointmentStatus;
  // Nombre de relance
  nb_reminders?: number;
  // Commentaire du RDV
  comment?: string;
  // Date du RDV sans heure (YYYY-MM-DD) en ISO
  date?: string;
  // Début horaire du RDV HH:mm
  start_time?: string;
  // Fin horaire du RDV HH:mm
  end_time?: string;
  // Date notifié
  notify_date?: string;
  // Date de première notification
  first_notify_date?: string;
  // Transitions
  transitions: Array<ITransition<AppointmentStatus>>;
  // Paramètrage
  settings?: {
    slot_type: SlotType;
    custom?: {
      slots: {
        start: number;
        end: number;
      }[];
    };
  };
}
