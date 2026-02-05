import { ILocalDate, ITracable } from '../../../../../lib-shared/src/lib/common/models/types.model';

export interface ICalendarDate {
  date: {
    date: string;
    utc_date: string;
  };
  derogatory_billing_date?: {
    date: string;
    utc_date: string;
  };
}

export interface ICalendarPeriod {
  related_closing_month: ILocalDate;
  sales_closing_date: ILocalDate;
  sales_accruals_closing_date: ILocalDate;
  purchase_closing_date: ILocalDate;
  purchase_accruals_closing_date: ILocalDate;
}

export interface ICalendar extends ITracable {
  _id: string;
  // Code du calendrier
  code?: string;
  // Nom du calendrier
  name?: string;
  // Pays (si calendrier des jours fériés)
  country?: {
    // Code iso du pays (ex fr)
    code: string;
    // Nom du pays dans la langue du pays
    name: string;
  };
  // Type du calendrier (facturation ou jours fériés à ce jour)
  type: CalendarTypes;
  // Dates du calendrier
  dates: ICalendarDate[];
  // Periodes de clotures
  periods?: ICalendarPeriod[];
}

export enum CalendarTypes {
  INVOICING = 'INVOICING',
  DAILY = 'DAILY',
  PERIODS = 'PERIODS',
  PUBLIC_HOLIDAYS = 'PUBLIC_HOLIDAYS'
}
