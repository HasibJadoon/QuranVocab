import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { McitDialogRef } from '../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../dialog/dialog.service';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { DateTime } from 'luxon';
import { CalendarApiRoute, CalendarsService } from '../../services/calendars.service';
import { ICalendar } from '../../models/calendar.model';
import { toSimpleLocalDateString } from '../../helpers/date.helper';

@Component({
  selector: 'mcit-modify-date-derogatory-modal',
  templateUrl: './modify-date-derogatory-modal.component.html',
  styleUrls: ['./modify-date-derogatory-modal.component.scss']
})
export class ModifyDateDerogatoryModalComponent implements OnInit {
  startDate: string;
  addDerogatoryDateForm: UntypedFormGroup;
  submitAttempt = false;
  warning = false;
  validity = true;
  derogatoryDate: Date;
  date: Date;
  minDate: Date;
  selectedCalendar: ICalendar;
  delete = false;
  DAY_RANGE = 15;
  apiRoute: CalendarApiRoute;

  constructor(
    private dialogRef: McitDialogRef<ModifyDateDerogatoryModalComponent, any>,
    @Inject(MCIT_DIALOG_DATA)
    data: { date: Date; derogatoryDate: Date; selectedCalendar: ICalendar; apiRoute: CalendarApiRoute },
    private formBuilder: UntypedFormBuilder
  ) {
    this.date = data.date;
    this.derogatoryDate = data.derogatoryDate;
    this.selectedCalendar = data.selectedCalendar;
    this.apiRoute = data.apiRoute;
  }

  ngOnInit(): void {
    this.addDerogatoryDateForm = this.formBuilder.group(
      {
        derogatory_date: ['', Validators.required]
      },
      {
        validators: this.validateDates()
      }
    );
    if (this.derogatoryDate) {
      const isoDate = DateTime.fromJSDate(this.derogatoryDate).toISODate();
      this.addDerogatoryDateForm.get('derogatory_date').setValue(isoDate);
    } else {
      const isoDate = DateTime.fromJSDate(this.date).toISODate();
      this.addDerogatoryDateForm.get('derogatory_date').setValue(isoDate);
    }
    this.minDate = new Date(this.date);
    this.minDate.setDate(this.date.getDate() - this.DAY_RANGE);
  }

  doClose(): void {
    this.dialogRef.close(this.derogatoryDate);
  }

  doSave(): void {
    this.submitAttempt = true;
    let derogatory_date = this.addDerogatoryDateForm.getRawValue().derogatory_date;
    if (toSimpleLocalDateString(this.date) === derogatory_date || this.delete) {
      derogatory_date = null;
      this.delete = true;
    }
    this.dialogRef.close(derogatory_date ? new Date(derogatory_date) : null);
  }

  private validateDates(): ValidatorFn {
    return (c: AbstractControl) => {
      if (c) {
        return !c.get('derogatory_date').value ? null : { validateDate: true };
      }
    };
  }

  setDelete(): void {
    this.delete = true;
  }

  isFormValid(): boolean {
    return this.addDerogatoryDateForm.get('derogatory_date').valid;
  }
}
