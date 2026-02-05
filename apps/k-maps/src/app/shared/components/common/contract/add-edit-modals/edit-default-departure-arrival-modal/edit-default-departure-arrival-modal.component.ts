import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { MCIT_DIALOG_DATA, McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { EditSubscriptionModalService } from '../edit-subscription-modal/edit-subscription-modal.service';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { IDefaultEndPoint } from '@lib-shared/common/contract/contract.model';
import { IWorking } from '../../../../../../../dispatcher/src/app/business/carrier/models/planning.model';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mcit-edit-default-departure-arrival-modal',
  templateUrl: './edit-default-departure-arrival-modal.component.html',
  styleUrls: ['./edit-default-departure-arrival-modal.component.scss']
})
export class EditDefaultDepartureArrivalModalComponent implements OnInit, OnDestroy {
  form: UntypedFormGroup;

  type: 'departure' | 'arrival';
  readOnly: boolean;

  private apiRoute: DispatcherApiRoutesEnum;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    data: {
      type: 'departure' | 'arrival';
      readOnly: boolean;
      apiRoute: DispatcherApiRoutesEnum;
      data: IDefaultEndPoint;
    },
    private dialogRef: McitDialogRef<EditDefaultDepartureArrivalModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private dialog: McitDialog,
    private editSubscriptionModalService: EditSubscriptionModalService
  ) {
    this.type = data.type;
    this.apiRoute = data.apiRoute;
    this.readOnly = data.readOnly;
    this.form = this.formBuilder.group({
      subscriptions: [null],
      has_appointment: [false],
      appointment: this.formBuilder.group({
        slot_type: [null, Validators.required],
        custom: this.formBuilder.group({
          slots: this.formBuilder.array(
            [this.buildSlotControl(8, 18)],
            Validators.compose([
              (c: AbstractControl) => {
                const ws = c.value as IDefaultEndPoint['appointment']['custom']['slots'];
                for (let i = 0; i < ws.length - 1; i++) {
                  const e1 = ws[i].end;
                  const s2 = ws[i + 1].start;
                  if (e1 != null && s2 != null && e1 > s2) {
                    return { custom_slots: true };
                  }
                }
                return null;
              },
              (c: AbstractControl) => {
                const ws = c.value as IWorking[];
                return ws?.length ? null : { required: true };
              }
            ])
          )
        })
      })
    });

    if (data.data?.appointment?.custom?.slots?.length > 0) {
      const slotsFormArray = this.form.get('appointment.custom.slots') as UntypedFormArray;
      slotsFormArray.clear();

      data.data?.appointment?.custom?.slots?.forEach(() => this.addSlotControl());
    }

    this.form.patchValue(lodash.defaults(data.data, { subscriptions: [], has_appointment: false }));

    if (data.data?.has_appointment) {
      this.form.get('appointment').enable();

      if (data.data.appointment?.slot_type === 'custom') {
        this.form.get('appointment.custom').enable();
      } else {
        this.form.get('appointment.custom').disable();
      }
    } else {
      this.form.get('appointment').disable();
    }
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.form
        .get('has_appointment')
        .valueChanges.pipe(
          tap((h) => {
            if (h) {
              this.form.get('appointment').enable();
            } else {
              this.form.get('appointment').disable();
            }
          })
        )
        .subscribe()
    );

    this.subscriptions.push(
      this.form
        .get('appointment.slot_type')
        .valueChanges.pipe(
          tap((h) => {
            if (h === 'custom') {
              this.form.get('appointment.custom').enable();
            } else {
              this.form.get('appointment.custom').disable();
            }
          })
        )
        .subscribe()
    );
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
        role: this.type === 'departure' ? 'PICKUP' : 'DELIVERY',
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
        role: this.type === 'departure' ? 'PICKUP' : 'DELIVERY',
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

  private addSlotControl(index: number = -1): AbstractControl {
    const slotsFormArray = this.form.get('appointment.custom.slots') as UntypedFormArray;

    const control = this.buildSlotControl();

    slotsFormArray.insert(index < 0 ? slotsFormArray.length : index, control);

    return control;
  }

  doDeleteSlot(i: number): void {
    const slotsFormArray = this.form.get('appointment.custom.slots') as UntypedFormArray;
    slotsFormArray.removeAt(i);
  }

  doAddSlot(i: number): void {
    this.addSlotControl(i + 1);
  }
}
