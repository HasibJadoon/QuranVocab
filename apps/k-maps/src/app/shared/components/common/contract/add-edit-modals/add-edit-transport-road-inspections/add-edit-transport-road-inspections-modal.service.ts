import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitAddEditTransportRoadInspectionsModalComponent } from './add-edit-transport-road-inspections-modal.component';
import { IAddInspectionstData } from './add-edit-transport-road-inspections-modal.component';

@Injectable()
export class McitAddEditTransportRoadInspectionsModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: IAddInspectionstData): Observable<string | undefined> {
    return this.dialog
      .open<McitAddEditTransportRoadInspectionsModalComponent, any, string>(McitAddEditTransportRoadInspectionsModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
