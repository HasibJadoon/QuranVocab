import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { IPricingClient, PricingClientTypeEnum } from '@lib-shared/common/contract/contract.model';

@Component({
  selector: 'mcit-pricing-client-modal',
  templateUrl: './pricing-client-modal.component.html',
  styleUrls: ['./pricing-client-modal.component.scss']
})
export class PricingClientModalComponent implements OnInit {
  pricingClientForm: UntypedFormGroup;
  pricingTypes: string[] = Object.keys(PricingClientTypeEnum);

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IPricingClient, private dialogRef: McitDialogRef<PricingClientModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.pricingClientForm = this.formBuilder.group({
      type: [{ value: this.modalData.type ?? PricingClientTypeEnum.DEFAULT, disabled: this.modalData.isDisabled }],
      amount: [{ value: this.modalData.amount ?? 0, disabled: this.modalData.isDisabled }],
      percentage: [{ value: this.modalData.percentage ?? 0, disabled: this.modalData.isDisabled }],
      price_mode_default_activity_code: [this.modalData.price_mode_default_activity_code ?? false]
    });
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doSave(): void {
    this.modalData.type = this.pricingClientForm.get('type').value;
    this.modalData.amount = this.pricingClientForm.get('amount').value;
    this.modalData.percentage = this.pricingClientForm.get('percentage').value;
    this.modalData.price_mode_default_activity_code = this.pricingClientForm.get('price_mode_default_activity_code').value;
    switch (this.modalData.type) {
      case PricingClientTypeEnum.DEFAULT:
        delete this.modalData.amount;
        delete this.modalData.percentage;
        delete this.modalData.currency;
        break;
      case PricingClientTypeEnum.PERCENTAGE:
        delete this.modalData.amount;
        delete this.modalData.currency;
        break;
      case PricingClientTypeEnum.AMOUNT:
        delete this.modalData.percentage;
        break;
    }
    this.dialogRef.close(this.modalData);
  }
}
