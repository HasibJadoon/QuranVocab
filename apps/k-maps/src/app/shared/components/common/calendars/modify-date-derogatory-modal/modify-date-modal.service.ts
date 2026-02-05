import { Injectable } from '@angular/core';
import { McitDialog } from '../../dialog/dialog.service';
import { Observable } from 'rxjs';
import { ModifyDateDerogatoryModalComponent } from './modify-date-derogatory-modal.component';
import { ICalendar } from '../../models/calendar.model';
import { CalendarApiRoute } from '../../services/calendars.service';

@Injectable({
  providedIn: 'root'
})
export class ModifyDateModalService {
  constructor(private dialog: McitDialog) {}

  setDerogatoryDate(date: Date, derogatoryDate: Date, selectedCalendar: ICalendar): Observable<Date> {
    const ref = this.dialog.open(ModifyDateDerogatoryModalComponent, {
      dialogClass: 'modal-md modal-dialog-centered',
      data: {
        date,
        derogatoryDate,
        selectedCalendar
      }
    });
    return ref.afterClosed();
  }
}
