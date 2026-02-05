import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DateTime } from 'luxon';

import { CalendarTypes, ICalendar } from '../models/calendar.model';

import { McitDialog } from '../dialog/dialog.service';
import { CalendarApiRoute, CalendarsService } from '../services/calendars.service';
import { McitPopupService } from '../services/popup.service';
import { McitWaitingService } from '../services/waiting.service';
import { McitQuestionModalService } from '../question-modal/question-modal.service';

import { AddEditCalendarModalComponent } from './add-edit-calendar-modal/add-edit-calendar-modal.component';
import { CalendarViewMode } from './calendar.domain';
import { ActivatedRoute, Router } from '@angular/router';
import { isNil, omitBy, cloneDeep } from 'lodash';

@Component({
  selector: 'mcit-calendars',
  templateUrl: './mcit-calendars.component.html',
  styleUrls: ['./mcit-calendars.component.scss']
})
export class McitCalendarsComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() editableInvoicing: boolean;
  @Input() editablePublicHolidays: boolean;
  @Input() editableAccountingPeriods: boolean;
  @Input() apiRoute: CalendarApiRoute;

  calendarViewMode = CalendarViewMode;
  viewMode: CalendarViewMode = CalendarViewMode.INVOICING;
  calendarType: CalendarTypes = CalendarTypes.INVOICING;
  calendars: ICalendar[];
  selectedCalendar: ICalendar = null;
  selectedCalendarId: string = null;
  lastUpdateDate: string = null;
  year: number;
  isSelectedCalendarEdited = false;
  isSaving = false;

  private static defaultCalendar = { [CalendarTypes.PUBLIC_HOLIDAYS]: 'FR' };

  private refreshSubject: Subject<boolean> = new Subject<boolean>();
  private subscriptions: Subscription[] = [];

  constructor(
    private dialog: McitDialog,
    private calendarsHttpService: CalendarsService,
    private popupService: McitPopupService,
    private waitingService: McitWaitingService,
    private questionModalService: McitQuestionModalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.viewMode = this.route.snapshot.queryParams.view ?? CalendarViewMode.INVOICING;
    this.setCalendarType(this.viewMode);
    this.year = this.route.snapshot.queryParams.year ?? new Date().getFullYear();

    this.subscriptions.push(
      this.refreshSubject
        .asObservable()
        .pipe(
          tap(() => {
            this.waitingService.showWaiting();
          }),
          switchMap(() =>
            this.calendarsHttpService.getAllByType(this.calendarType, '', this.apiRoute).pipe(
              catchError(() => {
                this.popupService.showError();
                return of([]);
              })
            )
          ),
          tap(() => this.waitingService.hideWaiting())
        )
        .subscribe(
          (next) => {
            this.router.navigate(['./'], {
              relativeTo: this.route,
              queryParams: omitBy(
                {
                  view: this.viewMode,
                  year: this.year
                },
                isNil
              ),
              replaceUrl: true
            });
            this.waitingService.hideWaiting();
            this.isSelectedCalendarEdited = false;
            this.calendars = next;
            if (this.calendars && this.calendars.length > 0) {
              let nextSelectedCalendar = this.calendars[0];
              if (this.calendarType === CalendarTypes.PUBLIC_HOLIDAYS) {
                const defaultHolidaysCalendar = McitCalendarsComponent.defaultCalendar[CalendarTypes.PUBLIC_HOLIDAYS];
                nextSelectedCalendar = this.calendars.find((cal) => cal.country.code === defaultHolidaysCalendar) || nextSelectedCalendar;
              }
              this.selectedCalendar = cloneDeep(nextSelectedCalendar);
              this.selectedCalendarId = this.selectedCalendar._id;
              this.lastUpdateDate = this.selectedCalendar.updated_date ? DateTime.fromISO(this.selectedCalendar.updated_date.toString()).toLocaleString(DateTime.DATE_SHORT) : null;
            } else {
              this.selectedCalendar = null;
              this.lastUpdateDate = null;
            }
          },
          () => this.popupService.showError()
        )
    );
  }

  onSelectCalendar(selectedCalendar: string): void {
    this.isSelectedCalendarEdited = false;
    this.selectedCalendar = cloneDeep(this.calendars.find((cal) => cal._id === selectedCalendar));
    this.lastUpdateDate = this.selectedCalendar.updated_date ? DateTime.fromISO(this.selectedCalendar.updated_date.toString()).toLocaleString(DateTime.DATE_SHORT) : null;
  }

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.refreshSubject.next(true);
    }, 0);
  }

  private setCalendarType(viewMode: CalendarViewMode): void {
    const viewModeToCalendarType = {
      invoicing: CalendarTypes.INVOICING,
      periods: CalendarTypes.PERIODS,
      public_holidays: CalendarTypes.PUBLIC_HOLIDAYS
    };
    this.calendarType = viewModeToCalendarType[viewMode] ?? null;
  }

  doViewMode(viewMode: CalendarViewMode): void {
    this.viewMode = viewMode;
    this.setCalendarType(viewMode);
    this.refreshSubject.next(true);
  }

  isEditable(): boolean {
    return (
      (this.viewMode === CalendarViewMode.INVOICING && this.editableInvoicing) ||
      (this.viewMode === CalendarViewMode.PERIODS && this.editableAccountingPeriods) ||
      (this.viewMode === CalendarViewMode.PUBLIC_HOLIDAYS && this.editablePublicHolidays)
    );
  }

  doAddCalendar(): void {
    this.dialog
      .open(AddEditCalendarModalComponent, {
        dialogClass: 'modal-md',
        data: {
          type: this.calendarType,
          isEditForm: false,
          apiRoute: this.apiRoute
        }
      })
      .afterClosed()
      .subscribe((next) => {
        if (next) {
          this.calendarsHttpService.get(next, this.apiRoute).subscribe(
            (next2) => {
              this.selectedCalendar = next2;
              this.lastUpdateDate = DateTime.fromISO(this.selectedCalendar.updated_date.toString()).toLocaleString(DateTime.DATE_SHORT);
              this.calendars.push(next2);
            },
            () => {
              this.waitingService.hideWaiting();
              this.popupService.showError();
            }
          );
        }
      });
  }

  doEditSelectedCalendar(): void {
    if (this.calendarType === CalendarTypes.INVOICING) {
      this.dialog
        .open(AddEditCalendarModalComponent, {
          dialogClass: 'modal-md',
          data: {
            type: CalendarTypes.INVOICING,
            isEditForm: true,
            id: this.selectedCalendar._id,
            apiRoute: this.apiRoute
          }
        })
        .afterClosed()
        .subscribe((next) => {
          if (next) {
            this.selectedCalendar.name = next.name;
            this.selectedCalendar.code = next.code;
          }
        });
    } else {
      this.popupService.showError();
    }
  }

  doDeleteSelectedCalendar(): void {
    if (this.selectedCalendar) {
      this.questionModalService.showQuestion('CALENDARS.DELETE_CALENDAR_MODAL.TITLE', 'CALENDARS.DELETE_CALENDAR_MODAL.QUESTION', 'COMMON.ERASE', 'COMMON.CANCEL', true).subscribe((result) => {
        if (result) {
          this.waitingService.showWaiting();
          this.calendarsHttpService.delete(this.selectedCalendar, this.apiRoute).subscribe(
            () => {
              this.calendars.splice(this.calendars.indexOf(this.selectedCalendar), 1);
              this.popupService.showSuccess('CALENDARS.DELETE_CALENDAR', {
                messageParams: { name: this.selectedCalendar.code }
              });
              if (this.calendars && this.calendars.length > 0) {
                this.selectedCalendar = this.calendars[0];
                this.lastUpdateDate = DateTime.fromISO(this.selectedCalendar.updated_date.toString()).toLocaleString(DateTime.DATE_SHORT);
              } else {
                this.selectedCalendar = null;
                this.lastUpdateDate = null;
                this.calendars = [];
              }
              this.waitingService.hideWaiting();
            },
            () => {
              this.waitingService.hideWaiting();
              this.popupService.showError();
            }
          );
        }
      });
    } else {
      this.popupService.showError();
    }
  }

  setYear(year: number): void {
    this.year = year;
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: omitBy(
        {
          view: this.viewMode,
          year: this.year
        },
        isNil
      ),
      replaceUrl: true
    });
  }

  onEdition(edited: boolean) {
    this.isSelectedCalendarEdited = edited;
  }

  doSave() {
    this.isSaving = true;
    this.calendarsHttpService.updateInvoicingDates(this.selectedCalendar, this.apiRoute).subscribe(
      (res) => {
        this.isSaving = false;
        this.isSelectedCalendarEdited = false;
        const calendarIndex = this.calendarType === CalendarTypes.PUBLIC_HOLIDAYS ? this.calendars.findIndex((cal) => cal.country.code === res.country.code) : this.calendars.findIndex((cal) => cal.code === res.code);
        this.calendars[calendarIndex] = res;
        this.popupService.showSuccess('CALENDAR.SAVED');
      },
      () => this.popupService.showError()
    );
  }
}
