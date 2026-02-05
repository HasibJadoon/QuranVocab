import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { IGrid } from '../../contract.model';
import { IServicesOrderGridModalData, ServicesOrderGridModalComponent } from './services-order-grid-modal.component';

@Injectable()
export class ServicesOrderGridModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IServicesOrderGridModalData): Observable<IGrid> {
    return this.dialog
      .open<ServicesOrderGridModalComponent, IServicesOrderGridModalData, IGrid>(ServicesOrderGridModalComponent, {
        dialogClass: 'modal-lg',
        data
      })
      .afterClosed();
  }
}
