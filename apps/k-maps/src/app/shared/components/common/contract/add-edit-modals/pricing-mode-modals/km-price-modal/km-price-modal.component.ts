import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { IKmDialogData } from '@lib-shared/common/models/contract/km-dialog.model';

@Component({
  selector: 'mcit-km-price-modal',
  templateUrl: './km-price-modal.component.html',
  styleUrls: ['./km-price-modal.component.scss']
})
export class KmPriceModalComponent implements OnInit {
  kmPriceForm: UntypedFormGroup;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IKmDialogData, private dialogRef: McitDialogRef<KmPriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.kmPriceForm = this.formBuilder.group({
      threshold: [{ value: this.modalData.threshold, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
      base_price: [{ value: this.modalData.base_price, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
      unit_price: [{ value: this.modalData.unit_price, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
      min_price: [{ value: this.modalData.min_price, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
    });
  }

  doSave(): void {
    this.modalData.threshold = this.kmPriceForm.get('threshold').value;
    this.modalData.base_price = this.kmPriceForm.get('base_price').value;
    this.modalData.unit_price = this.kmPriceForm.get('unit_price').value;
    this.modalData.min_price = this.kmPriceForm.get('min_price').value;
    this.dialogRef.close(this.modalData);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
