import { Component, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { MCIT_DIALOG_DATA, McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { EditSubscriptionModalService } from '../edit-subscription-modal/edit-subscription-modal.service';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { IDefaultSubscription } from '@lib-shared/common/contract/contract.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mcit-edit-default-subscription-modal',
  templateUrl: './edit-default-subscription-modal.component.html',
  styleUrls: ['./edit-default-subscription-modal.component.scss']
})
export class EditDefaultSubscriptionModalComponent implements OnDestroy {
  form: UntypedFormGroup;

  type: 'supplier';
  readOnly: boolean;

  private apiRoute: DispatcherApiRoutesEnum;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    data: {
      type: 'supplier';
      readOnly: boolean;
      apiRoute: DispatcherApiRoutesEnum;
      data: IDefaultSubscription;
    },
    private dialogRef: McitDialogRef<EditDefaultSubscriptionModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private dialog: McitDialog,
    private editSubscriptionModalService: EditSubscriptionModalService
  ) {
    this.type = data.type;
    this.apiRoute = data.apiRoute;
    this.readOnly = data.readOnly;
    this.form = this.formBuilder.group({
      subscriptions: [null]
    });

    this.form.patchValue(lodash.defaults(data.data, { subscriptions: [] }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  doSave(): void {
    if (this.form.invalid) {
      return;
    }

    const data = this.form.value;
    this.dialogRef.close(data);
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doAddSubscription(): void {
    this.editSubscriptionModalService
      .editSubscription(null, {
        apiRoute: this.apiRoute,
        role: this.type.toUpperCase(),
        service: this.apiRoute,
        third_party_id: null
      })
      .subscribe((data) => {
        if (data) {
          const subscriptionsControl = this.form.get('subscriptions');
          let ss = subscriptionsControl.value as ISubscriptionMemberRole[];
          if (ss == null) {
            ss = [];
          }
          ss.push(data);
          subscriptionsControl.setValue(ss);
        }
      });
  }

  doEditSubscription(index: number, subscription: ISubscriptionMemberRole): void {
    this.editSubscriptionModalService
      .editSubscription(subscription, {
        apiRoute: this.apiRoute,
        role: this.type.toUpperCase(),
        service: this.apiRoute,
        third_party_id: null
      })
      .subscribe((data) => {
        if (data) {
          const subscriptionsControl = this.form.get('subscriptions');
          const ss = subscriptionsControl.value as ISubscriptionMemberRole[];
          ss[index] = data;
          subscriptionsControl.setValue(ss);
        }
      });
  }

  doDeleteSubscription(index: number): void {
    const subscriptionsControl = this.form.get('subscriptions');
    let ss = subscriptionsControl.value as ISubscriptionMemberRole[];
    ss = ss.filter((x, i) => i !== index);
    subscriptionsControl.setValue(ss);
  }

  private buildSlotControl(s: number = null, e: number = null): AbstractControl {
    return this.formBuilder.group(
      {
        start: [s, Validators.compose([Validators.required, Validators.min(0), Validators.max(23)])],
        end: [e, Validators.compose([Validators.required, Validators.min(1), Validators.max(24)])]
      },
      {
        validators: (c: AbstractControl) => {
          const start = c.get('start').value;
          const end = c.get('end').value;
          if (start == null || end == null || start < end) {
            return null;
          }
          return { start_end: true };
        }
      }
    );
  }
}
