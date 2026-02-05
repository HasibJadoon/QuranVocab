import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { EditBillingContactModalComponent } from './edit-billing-contact-modal.component';

@Injectable()
export class EditBillingContactModalService {
  constructor(private dialog: McitDialog) {}

  editBillingContact(billingContact: any, isDisabled: boolean): Observable<any> {
    const ref = this.dialog.open<EditBillingContactModalComponent, any, any>(EditBillingContactModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        billingContact,
        isDisabled
      }
    });
    return ref.afterClosed();
  }
}
