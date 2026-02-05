import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitAddEditMeansRoadContractModalComponent } from './add-edit-means-road-contract-modal.component';
import { IAddEditContractData } from '../add-edit-contract-data.model';

@Injectable()
export class McitAddEditMeansRoadContractModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IAddEditContractData): Observable<string> {
    return this.dialog
      .open<McitAddEditMeansRoadContractModalComponent, any, string>(McitAddEditMeansRoadContractModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
