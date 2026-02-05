import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MCIT_DIALOG_DATA } from '../../dialog/dialog.service';
import { CalendarApiRoute, CalendarsService } from '../../services/calendars.service';
import { McitPopupService } from '../../services/popup.service';
import { McitWaitingService } from '../../services/waiting.service';

import { ICalendar, CalendarTypes } from '../../models/calendar.model';
import { McitDialogRef } from '../../dialog/dialog-ref';
import { McitMeaningPipe } from '../../common/pipes/meaning.pipe';

@Component({
  selector: 'mcit-add-edit-calendar-modal',
  templateUrl: './add-edit-calendar-modal.component.html',
  styleUrls: ['./add-edit-calendar-modal.component.scss'],
  providers: [McitMeaningPipe]
})
export class AddEditCalendarModalComponent implements OnInit, OnDestroy {
  data: { id: string; isEditForm: boolean; type: CalendarTypes; apiRoute: CalendarApiRoute } = {
    id: null,
    isEditForm: false,
    type: CalendarTypes.INVOICING,
    apiRoute: CalendarApiRoute.ADMIN
  };
  editedCalendar: ICalendar = null;
  calendarForm: UntypedFormGroup;
  submitAttempt = false;

  private subscriptions: Subscription[] = [];
  private country: any;

  constructor(
    @Inject(MCIT_DIALOG_DATA) modalData: { id: string; isEditForm: boolean; type: CalendarTypes },
    private dialogRef: McitDialogRef<AddEditCalendarModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService,
    private waitingService: McitWaitingService,
    private calendarsHttpService: CalendarsService,
    private meaningPipe: McitMeaningPipe
  ) {
    this.data = Object.assign(this.data, modalData);
    if (this.data.type === CalendarTypes.PUBLIC_HOLIDAYS) {
      this.calendarForm = this.formBuilder.group({
        country: ['', Validators.required]
      });
    } else {
      this.calendarForm = this.formBuilder.group({
        code: [{ value: '', disabled: this.data.isEditForm }, Validators.compose([Validators.pattern(/^[a-zA-Z\d]+$/), Validators.maxLength(256), Validators.required])],
        name: ['', Validators.compose([Validators.minLength(1), Validators.maxLength(256), Validators.required])]
      });
    }
  }

  ngOnInit(): void {
    if (this.data.isEditForm) {
      this.waitingService.showWaiting();
      this.calendarsHttpService.get(this.data.id, this.data.apiRoute).subscribe(
        (calendar: ICalendar) => {
          this.editedCalendar = calendar;
          this.calendarForm.patchValue({
            code: calendar.code,
            name: calendar.name
          });
          this.waitingService.hideWaiting();
        },
        () => {
          this.waitingService.hideWaiting();
          this.popupService.showError();
          this.dialogRef.close();
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  doSave(): void {
    this.submitAttempt = true;
    if (!this.calendarForm.valid) {
      return;
    }

    const form = this.calendarForm.getRawValue();
    let obj: Partial<ICalendar> = {};

    if (this.data.type === CalendarTypes.INVOICING) {
      obj = {
        code: form.code,
        name: form.name,
        type: CalendarTypes.INVOICING
      };
    } else if (this.country) {
      obj = {
        country: this.country,
        type: CalendarTypes.PUBLIC_HOLIDAYS
      };
    }

    if (this.data.isEditForm && this.data.type === CalendarTypes.INVOICING) {
      const updatedCalendar = {
        ...obj,
        _id: this.data.id
      } as ICalendar;
      this.update(updatedCalendar);
    } else {
      this.create(obj);
    }
  }

  doCountryChange(country: any): void {
    if (country) {
      this.country = {
        code: country.code,
        name: this.meaningPipe.transform(country.names)
      };
    } else {
      this.country = null;
    }
  }

  private update(calendar: ICalendar): void {
    this.waitingService.showWaiting();
    this.calendarsHttpService.update(calendar, this.data.apiRoute).subscribe(
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('CALENDARS.ADD_EDIT_CALENDARS_MODAL.EDIT_SUCCESS', {
          messageParams: { name: calendar.code }
        });
        this.dialogRef.close({ name: calendar.name, code: calendar.code });
      },
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }

  private create(calendar: Partial<ICalendar>): void {
    this.waitingService.showWaiting();
    this.calendarsHttpService.create(calendar, this.data.apiRoute).subscribe(
      (next) => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('CALENDARS.ADD_EDIT_CALENDARS_MODAL.ADD_SUCCESS', {
          messageParams: { name: this.data.type === CalendarTypes.INVOICING ? calendar.code : calendar.country.name }
        });
        this.dialogRef.close(next);
      },
      () => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
