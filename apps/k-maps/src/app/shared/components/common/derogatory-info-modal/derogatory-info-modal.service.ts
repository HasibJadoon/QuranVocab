import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import { McitDerogatoryInfoModalComponent } from './derogatory-info-modal.component';
import { IDerogatory } from '../models/derogatory.model';

@Injectable()
export class McitDerogatoryInfoModalService {
  constructor(private dialog: McitDialog) {}

  showModal(derogatoryInformation: IDerogatory): Observable<void> {
    const ref = this.dialog.open<McitDerogatoryInfoModalComponent, any, void>(McitDerogatoryInfoModalComponent, {
      dialogClass: `modal-dialog-centered ${derogatoryInformation?.supplier?.name || derogatoryInformation?.billed_customer?.name ? 'modal-lg' : ''}`,
      data: derogatoryInformation
    });
    return ref.afterClosed();
  }
}
