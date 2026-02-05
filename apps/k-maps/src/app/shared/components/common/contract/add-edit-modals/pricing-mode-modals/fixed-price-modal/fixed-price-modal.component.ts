import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';

@Component({
  selector: 'mcit-fixed-price-modal',
  templateUrl: './fixed-price-modal.component.html',
  styleUrls: ['./fixed-price-modal.component.scss']
})
export class FixedPriceModalComponent implements OnInit {
  fixedPriceForm: UntypedFormGroup;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: { fixedPrice: number; title: string; isDisabled: boolean }, private dialogRef: McitDialogRef<FixedPriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.fixedPriceForm = this.formBuilder.group({
      fixedPrice: [{ value: this.modalData.fixedPrice, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
    });
  }

  doSave(): void {
    this.modalData.fixedPrice = this.fixedPriceForm.get('fixedPrice').value;
    this.dialogRef.close(this.modalData.fixedPrice);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
