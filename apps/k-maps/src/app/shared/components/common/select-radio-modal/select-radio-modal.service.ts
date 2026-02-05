import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitSelectRadioModalComponent } from './select-radio-modal.component';

@Injectable()
export class McitSelectRadioModalService {
  constructor(private dialog: McitDialog) {}

  selectRadio(values: any[]): Observable<any> {
    const ref = this.dialog.open<McitSelectRadioModalComponent, any, any>(McitSelectRadioModalComponent, {
      dialogClass: 'modal-sm modal-dialog-centered',
      disableClose: false,
      data: {
        values
      }
    });
    return ref.afterClosed();
  }
}
