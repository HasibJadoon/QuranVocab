import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { IGrid } from '../../contract.model';
import { IServicesGridModalData, ServicesGridModalComponent } from './services-grid-modal.component';

@Injectable()
export class ServicesGridModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IServicesGridModalData): Observable<IGrid> {
    return this.dialog
      .open<ServicesGridModalComponent, IServicesGridModalData, IGrid>(ServicesGridModalComponent, {
        dialogClass: 'modal-lg',
        data
      })
      .afterClosed();
  }
}
