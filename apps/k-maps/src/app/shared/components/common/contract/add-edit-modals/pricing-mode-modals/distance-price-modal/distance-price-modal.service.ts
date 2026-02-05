import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../../dialog/dialog.service';
import { IDistancePricing } from '../../../contract.model';
import { IDistancePriceModalData, McitDistancePriceModalComponent } from './distance-price-modal.component';

@Injectable()
export class McitDistancePriceModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IDistancePriceModalData): Observable<void | IDistancePricing> {
    return this.dialog
      .open<McitDistancePriceModalComponent, any, void>(McitDistancePriceModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
