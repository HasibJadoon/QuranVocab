import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { IRangeDialogData } from '@lib-shared/common/models/contract/range-dialog.model';

@Component({
  selector: 'mcit-range-price-modal',
  templateUrl: './range-price-modal.component.html',
  styleUrls: ['./range-price-modal.component.scss']
})
export class RangePriceModalComponent implements OnInit {
  rangePriceForm: UntypedFormGroup;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IRangeDialogData, private dialogRef: McitDialogRef<RangePriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.rangePriceForm = this.formBuilder.group(
      {
        min: [{ value: this.modalData.min, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
        max: [{ value: this.modalData.max, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
        price: [{ value: this.modalData.price, disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
      },
      { validator: checkIfMaxisHigherThanMin }
    );
  }

  checkError(): boolean {
    return this.rangePriceForm.hasError('minHigherThanMax');
  }

  doSave(): void {
    this.modalData.min = this.rangePriceForm.get('min').value;
    this.modalData.max = this.rangePriceForm.get('max').value;
    this.modalData.price = this.rangePriceForm.get('price').value;
    this.dialogRef.close(this.modalData);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}

function checkIfMaxisHigherThanMin(rangePriceForm: AbstractControl): { minHigherThanMax: boolean } {
  if (rangePriceForm.get('min').value === null || rangePriceForm.get('max').value === null) {
    return null;
  } else if (rangePriceForm.get('min').value > rangePriceForm.get('max').value) {
    return { minHigherThanMax: true };
  } else {
    return null;
  }
}
