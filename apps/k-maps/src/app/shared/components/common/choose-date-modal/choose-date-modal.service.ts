import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitChooseDateModalComponent } from './choose-date-modal.component';
import { McitDialog } from '../dialog/dialog.service';

@Injectable()
export class McitChooseDateModalService {
  constructor(private dialog: McitDialog) {}

  chooseDate(title: string, questionKey: string, positiveKey: string, negativeKey: string, initialDate: Date, danger: boolean = false): Observable<Date> {
    const ref = this.dialog.open<McitChooseDateModalComponent, any, Date>(McitChooseDateModalComponent, {
      dialogClass: 'modal-sm modal-dialog-centered',
      data: {
        title,
        question: questionKey,
        negativeAction: negativeKey,
        positiveAction: positiveKey,
        initialDate,
        danger
      }
    });
    return ref.afterClosed();
  }
}
