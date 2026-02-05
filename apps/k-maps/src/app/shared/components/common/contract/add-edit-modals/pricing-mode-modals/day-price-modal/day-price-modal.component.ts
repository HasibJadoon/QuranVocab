import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';

export interface IDayPriceModalData {
  day_pricing: {
    tarif_code?: string;
    price_per_day: number;
    day_included_bunker_unit_price?: number;
  };
  isDisabled?: boolean;
}

@Component({
  selector: 'mcit-day-price-modal',
  templateUrl: './day-price-modal.component.html',
  styleUrls: ['./day-price-modal.component.scss']
})
export class McitDayPriceModalComponent implements OnInit {
  dayPricingForm: UntypedFormGroup;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IDayPriceModalData, private dialogRef: McitDialogRef<McitDayPriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.dayPricingForm = this.formBuilder.group({
      tarif_code: this.modalData.day_pricing?.tarif_code ?? null,
      price_per_day: [{ value: this.modalData.day_pricing?.price_per_day ?? null, disabled: this.modalData.isDisabled }, Validators.required],
      day_included_bunker_unit_price: this.modalData.day_pricing?.day_included_bunker_unit_price ?? null
    });
  }

  doSave(): void {
    this.dialogRef.close({
      tarif_code: this.dayPricingForm.get('tarif_code').value || undefined,
      price_per_day: this.dayPricingForm.get('price_per_day').value,
      day_included_bunker_unit_price: this.dayPricingForm.get('day_included_bunker_unit_price').value || undefined
    });
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
