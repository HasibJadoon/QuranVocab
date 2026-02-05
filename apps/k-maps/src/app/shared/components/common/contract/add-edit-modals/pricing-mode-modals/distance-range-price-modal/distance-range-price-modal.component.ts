import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';

export interface IDistanceRangePriceModalData {
  distance_range_pricing: {
    distance_range_pricing_grid: IDistanceRangePricingItem[];
  };
  isDisabled?: boolean;
}

interface IDistanceRangePricingItem {
  tarif_code?: string;
  pricing?: {
    min: number;
    max: number;
    price: number;
    distance_per_km_included_bunker_unit_price?: number;
  };
}

function checkIfMaxisHigherThanMin(distanceRangePricingForm: AbstractControl): { minHigherThanMax: boolean } {
  if (distanceRangePricingForm.get('_distance_range_pricing_item.pricing.min').value === null || distanceRangePricingForm.get('_distance_range_pricing_item.pricing.max').value === null) {
    return null;
  } else if (distanceRangePricingForm.get('_distance_range_pricing_item.pricing.min').value > distanceRangePricingForm.get('_distance_range_pricing_item.pricing.max').value) {
    return { minHigherThanMax: true };
  } else {
    return null;
  }
}

@Component({
  selector: 'mcit-distance-range-price-modal',
  templateUrl: './distance-range-price-modal.component.html',
  styleUrls: ['./distance-range-price-modal.component.scss']
})
export class McitDistanceRangePriceModalComponent implements OnInit, OnDestroy {
  distanceRangePricingForm: UntypedFormGroup;

  distanceRangePricingItem: IDistanceRangePricingItem | null;
  private subscriptions: Subscription[] = [];

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IDistanceRangePriceModalData, private dialogRef: McitDialogRef<McitDistanceRangePriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.distanceRangePricingForm = this.formBuilder.group(
      {
        _distance_range_pricing_item: this.formBuilder.group({
          tarif_code: [{ value: '', disabled: this.modalData.isDisabled }],
          pricing: this.formBuilder.group({
            min: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            max: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            distance_per_km_included_bunker_unit_price: [{ value: '', disabled: this.modalData.isDisabled }]
          })
        }),
        distance_range_pricing_grid: [this.modalData.distance_range_pricing?.distance_range_pricing_grid || [], Validators.required]
      },
      { validator: checkIfMaxisHigherThanMin }
    );

    this.subscriptions.push(
      this.distanceRangePricingForm.get('_distance_range_pricing_item').valueChanges.subscribe((next) => {
        if (next) {
          this.distanceRangePricingItem = next;
        } else {
          this.distanceRangePricingItem = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  checkMinMaxError(): boolean {
    return this.distanceRangePricingForm.hasError('minHigherThanMax');
  }

  doAddItem(): void {
    let distanceRangePricingGrid = this.distanceRangePricingForm.get('distance_range_pricing_grid').value;
    if (!distanceRangePricingGrid) {
      distanceRangePricingGrid = [];
    }
    if (!this.distanceRangePricingItem.tarif_code) {
      delete this.distanceRangePricingItem.tarif_code;
    }
    distanceRangePricingGrid.push(this.distanceRangePricingItem);

    this.distanceRangePricingForm.get('distance_range_pricing_grid').setValue(distanceRangePricingGrid);

    this.distanceRangePricingItem = null;
    this.distanceRangePricingForm.get('_distance_range_pricing_item').reset({ tarif_code: null });
  }

  doDeleteItem(i: number): void {
    const distanceRangePricingGrid = this.distanceRangePricingForm.get('distance_range_pricing_grid').value;
    this.distanceRangePricingForm.get('distance_range_pricing_grid').setValue(distanceRangePricingGrid.filter((elem, index) => index !== i));
  }

  doSave(): void {
    this.dialogRef.close({
      distance_range_pricing_grid: this.distanceRangePricingForm.get('distance_range_pricing_grid').value
    });
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
