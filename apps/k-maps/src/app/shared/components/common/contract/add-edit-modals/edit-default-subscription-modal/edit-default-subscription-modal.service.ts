import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { EditDefaultSubscriptionModalComponent } from '@lib-shared/common/contract/add-edit-modals/edit-default-subscription-modal/edit-default-subscription-modal.component';

@Injectable()
export class EditDefaultSubscriptionModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: { type: 'supplier'; readOnly: boolean; data: { subscriptions: ISubscriptionMemberRole[] } }): Observable<string> {
    return this.dialog
      .open<EditDefaultSubscriptionModalComponent, any, string>(EditDefaultSubscriptionModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
