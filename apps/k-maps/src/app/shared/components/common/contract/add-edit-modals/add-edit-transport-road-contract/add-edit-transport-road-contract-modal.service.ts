import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { IAddEditContractData } from '../add-edit-contract-data.model';
import { McitAddEditTransportRoadContractModalComponent } from '@lib-shared/common/contract/add-edit-modals/add-edit-transport-road-contract/add-edit-transport-road-contract-modal.component';

@Injectable()
export class McitAddEditTransportRoadContractModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IAddEditContractData): Observable<string> {
    return this.dialog
      .open<McitAddEditTransportRoadContractModalComponent, any, string>(McitAddEditTransportRoadContractModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
