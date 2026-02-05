import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { ICalendar } from '../models/calendar.model';
import { CalendarApiRoute, CalendarsService } from '@lib-shared/common/services/calendars.service';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CalendarsCacheService {
  private phCache: { [key: string]: Subject<ICalendar> } = {};

  constructor(private calendarsService: CalendarsService) {}

  getPublicHolidaysCalendar(country: string, calendarApiRoute: CalendarApiRoute): Observable<ICalendar | null> {
    if (!country) {
      return of(null);
    }

    if (this.phCache[country]) {
      return this.phCache[country].asObservable();
    }

    this.phCache[country] = new ReplaySubject(1);

    return this.calendarsService.getPublicHolidays(country, calendarApiRoute).pipe(
      catchError(() => of(null)),
      tap((res) => {
        this.phCache[country].next(res);
        this.phCache[country].complete();
      })
    );
  }
}
