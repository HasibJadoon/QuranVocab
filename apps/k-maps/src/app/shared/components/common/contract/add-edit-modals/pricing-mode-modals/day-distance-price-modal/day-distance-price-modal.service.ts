import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../../dialog/dialog.service';
import { IDayDistancePricing } from '../../../contract.model';
import { IDayDistancePriceModalData, McitDayDistancePriceModalComponent } from './day-distance-price-modal.component';

@Injectable()
export class McitDayDistancePriceModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IDayDistancePriceModalData): Observable<void | IDayDistancePricing> {
    return this.dialog
      .open<McitDayDistancePriceModalComponent, any, void>(McitDayDistancePriceModalComponent, {
        dialogClass: 'modal-lg',
        data
      })
      .afterClosed();
  }
}
