import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { AddEditAdditionalServicesModalComponent } from '@lib-shared/common/contract/add-edit-modals/add-edit-additional-services-modal/add-edit-additional-services-modal.component';

@Injectable()
export class AddEditAdditionalServicesModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: { isEditForm: boolean; id: string; owner: string }): Observable<void> {
    return this.dialog
      .open<AddEditAdditionalServicesModalComponent, { isEditForm: boolean; id: string; owner: string }, void>(AddEditAdditionalServicesModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
