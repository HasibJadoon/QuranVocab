import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { setListToUpperCase } from '../../../../../../../../accounting/src/app/business/helpers/list-uppercase.helper';

@Component({
  selector: 'mcit-valorization-modal',
  templateUrl: './valorization-modal.component.html',
  styleUrls: ['./valorization-modal.component.scss']
})
export class ValorizationModalComponent implements OnInit {
  valorizationForm: UntypedFormGroup;

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: { product_code?: string[]; invoicing_software: string; rank?: number; isDisabled: boolean },
    private dialogRef: McitDialogRef<ValorizationModalComponent>,
    private formBuilder: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.valorizationForm = this.formBuilder.group(
      {
        product_code: [{ value: [], disabled: this.modalData.isDisabled }],
        rank: [{ value: null, disabled: this.modalData.isDisabled }]
      },
      { validator: checkIfRankIsPositiveOrNull }
    );
    if (this.modalData && this.modalData.product_code) {
      this.valorizationForm.get('product_code').setValue(setListToUpperCase(this.modalData.product_code));
    } else {
      this.valorizationForm.get('product_code').setValue([]);
    }
    if (this.modalData && this.modalData.rank) {
      this.valorizationForm.get('rank').setValue(this.modalData.rank);
    }
  }

  onTagListChange(list: any[]): void {
    const upperCaseList = setListToUpperCase(list);
    this.modalData.product_code = upperCaseList;
    this.valorizationForm.controls['product_code'].setValue(upperCaseList);
  }

  doSave(): void {
    this.modalData.product_code = this.valorizationForm.get('product_code').value;
    this.modalData.rank = this.valorizationForm.get('rank').value;
    if (this.valorizationForm.get('rank').value === '') {
      this.modalData.rank = null;
    }
    this.dialogRef.close(this.modalData);
  }

  goBack(): void {
    this.dialogRef.close();
  }

  checkError(): boolean {
    return this.valorizationForm.hasError('rankNegative');
  }

  protected readonly setListToUpperCase = setListToUpperCase;
}

function checkIfRankIsPositiveOrNull(valorizationForm: AbstractControl): { rankNegative: boolean } {
  if (valorizationForm.get('rank').value === null || valorizationForm.get('rank').value === '') {
    return null;
  } else if (valorizationForm.get('rank').value < 1) {
    return { rankNegative: true };
  } else if (valorizationForm.get('rank').value >= 1) {
    return null;
  } else {
    return { rankNegative: true };
  }
}
