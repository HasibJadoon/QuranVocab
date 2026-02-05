import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalendarTypes, ICalendar, ICalendarPeriod } from '../models/calendar.model';
import { McitCoreEnv } from '../helpers/provider.helper';

export enum CalendarApiRoute {
  ADMIN = 'admin',
  ACCOUNTING = 'accounting',
  DISPATCHER = 'dispatcher'
}

export enum CalendarPeriodClosingDateType {
  SALES_CLOSING_DATE = 'sales_closing_date',
  PURCHASE_CLOSING_DATE = 'purchase_closing_date',
  ACCRUALS_SALES_CLOSING_DATE = 'sales_accruals_closing_date',
  ACCRUALS_PURCHASE_CLOSING_DATE = 'purchase_accruals_closing_date'
}

@Injectable({
  providedIn: 'root'
})
export class CalendarsService {
  constructor(private env: McitCoreEnv, private httpClient: HttpClient) {}

  getAllByType(type: CalendarTypes, sort: string, calendarApiRoute: CalendarApiRoute): Observable<ICalendar[]> {
    return this.httpClient.get<ICalendar[]>(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars?type=${type ?? ''}&sort=${sort}`);
  }

  get(id: string, calendarApiRoute: CalendarApiRoute): Observable<ICalendar> {
    return this.httpClient.get<ICalendar>(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/${id}`);
  }

  create(calendar: Partial<ICalendar>, calendarApiRoute: CalendarApiRoute): Observable<string> {
    return this.httpClient.post(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars`, calendar, {
      responseType: 'text'
    });
  }

  update(calendar: ICalendar, calendarApiRoute: CalendarApiRoute): Observable<string> {
    return this.httpClient.put(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/${calendar._id}`, calendar, {
      responseType: 'text'
    });
  }

  updateInvoicingDates(calendar: ICalendar, calendarApiRoute: CalendarApiRoute): Observable<ICalendar> {
    return this.httpClient.put<ICalendar>(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/${calendar._id}/update-dates`, calendar);
  }

  addOrRemoveAccountingPeriod(_id: string, dates: ICalendarPeriod, hasClosingMonthOnCurrentDate: boolean = false, calendarApiRoute: CalendarApiRoute): Observable<ICalendar> {
    return this.httpClient.put<ICalendar>(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/${_id}/accounting-period`, {
      related_closing_month: dates.related_closing_month.date,
      sales_closing_date: dates.sales_closing_date.date,
      sales_accruals_closing_date: dates.sales_accruals_closing_date.date,
      purchase_closing_date: dates.purchase_closing_date.date,
      purchase_accruals_closing_date: dates.purchase_accruals_closing_date.date,
      addAccountingPeriod: hasClosingMonthOnCurrentDate
    });
  }

  delete(calendar: ICalendar, calendarApiRoute: CalendarApiRoute): Observable<string> {
    return this.httpClient.delete(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/${calendar._id}`, {
      responseType: 'text'
    });
  }

  getAccountingPeriodByCurrentMonth(closingDateType: CalendarPeriodClosingDateType, calendarApiRoute: CalendarApiRoute): Observable<ICalendarPeriod> {
    return this.httpClient.get<ICalendarPeriod>(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/accounting-period`, { params: { closingDateType } });
  }

  getPublicHolidays(country: string, calendarApiRoute: CalendarApiRoute): Observable<ICalendar> {
    return this.httpClient.get<ICalendar>(`${this.env.apiUrl}/v2/${calendarApiRoute}/referentials/calendars/public-holidays/${country}`);
  }
}
