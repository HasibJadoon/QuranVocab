import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';

export interface IDayDistancePriceModalData {
  day_distance_pricing: {
    tarif_code?: string;
    price_per_distance: number;
    price_per_day: number;
    day_included_bunker_unit_price?: number;
    distance_included_bunker_unit_price?: number;
  };
  isDisabled?: boolean;
}

@Component({
  selector: 'mcit-day-distance-price-modal',
  templateUrl: './day-distance-price-modal.component.html',
  styleUrls: ['./day-distance-price-modal.component.scss']
})
export class McitDayDistancePriceModalComponent implements OnInit {
  dayDistancePricingForm: UntypedFormGroup;

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IDayDistancePriceModalData, private dialogRef: McitDialogRef<McitDayDistancePriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.dayDistancePricingForm = this.formBuilder.group({
      tarif_code: this.modalData.day_distance_pricing?.tarif_code ?? null,
      price_per_distance: [{ value: this.modalData.day_distance_pricing?.price_per_distance ?? null, disabled: this.modalData.isDisabled }, Validators.required],
      price_per_day: [{ value: this.modalData.day_distance_pricing?.price_per_day ?? null, disabled: this.modalData.isDisabled }, Validators.required],
      day_included_bunker_unit_price: this.modalData.day_distance_pricing?.day_included_bunker_unit_price ?? null,
      distance_included_bunker_unit_price: this.modalData.day_distance_pricing?.distance_included_bunker_unit_price ?? null
    });
  }

  doSave(): void {
    this.dialogRef.close({
      tarif_code: this.dayDistancePricingForm.get('tarif_code').value || undefined,
      price_per_distance: this.dayDistancePricingForm.get('price_per_distance').value,
      price_per_day: this.dayDistancePricingForm.get('price_per_day').value,
      day_included_bunker_unit_price: this.dayDistancePricingForm.get('day_included_bunker_unit_price').value,
      distance_included_bunker_unit_price: this.dayDistancePricingForm.get('distance_included_bunker_unit_price').value
    });
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
