import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { EditSubscriptionModalComponent } from './edit-subscription-modal.component';
import { ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';

@Injectable()
export class EditSubscriptionModalService {
  constructor(private dialog: McitDialog) {}

  editSubscription(
    subscription: ISubscriptionMemberRole,
    options?: {
      apiRoute: DispatcherApiRoutesEnum;
      role: string;
      service: string;
      third_party_id: string;
      withPushNotifications?: boolean;
    }
  ): Observable<any> {
    const ref = this.dialog.open<EditSubscriptionModalComponent, any, any>(EditSubscriptionModalComponent, {
      dialogClass: 'modal-dialog-centered modal-lg',
      data: {
        apiRoute: options?.apiRoute,
        role: options?.role,
        service: options?.service,
        third_party_id: options?.third_party_id,
        subscription
      }
    });
    return ref.afterClosed();
  }
}
