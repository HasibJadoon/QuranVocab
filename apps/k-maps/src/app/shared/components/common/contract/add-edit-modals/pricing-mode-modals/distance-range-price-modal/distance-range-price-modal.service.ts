import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../../dialog/dialog.service';
import { IDistancePricing } from '../../../contract.model';
import { IDistanceRangePriceModalData, McitDistanceRangePriceModalComponent } from './distance-range-price-modal.component';

@Injectable()
export class McitDistanceRangePriceModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IDistanceRangePriceModalData): Observable<void | IDistancePricing> {
    return this.dialog
      .open<McitDistanceRangePriceModalComponent, any, void>(McitDistanceRangePriceModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
