import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../../dialog/dialog.service';
import { EditDefaultDepartureArrivalModalComponent } from '@lib-shared/common/contract/add-edit-modals/edit-default-departure-arrival-modal/edit-default-departure-arrival-modal.component';
import { ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';

@Injectable()
export class EditDefaultDepartureArrivalModalService {
  constructor(private dialog: McitDialog) {}

  showModal(data: { type: 'departure' | 'arrival'; readOnly: boolean; data: { subscriptions: ISubscriptionMemberRole[]; has_rdv: boolean } }): Observable<string> {
    return this.dialog
      .open<EditDefaultDepartureArrivalModalComponent, any, string>(EditDefaultDepartureArrivalModalComponent, {
        dialogClass: 'modal-xl',
        data
      })
      .afterClosed();
  }
}
