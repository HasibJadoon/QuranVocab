import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../../dialog/dialog.service';
import { IDayPricing } from '../../../contract.model';
import { IDayPriceModalData, McitDayPriceModalComponent } from './day-price-modal.component';

@Injectable()
export class McitDayPriceModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IDayPriceModalData): Observable<void | IDayPricing> {
    return this.dialog
      .open<McitDayPriceModalComponent, any, void>(McitDayPriceModalComponent, {
        dialogClass: 'modal-md',
        data
      })
      .afterClosed();
  }
}
