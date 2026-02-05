import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { McitDialogRef } from '../../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../../dialog/dialog.service';
import { CountriesHttpService } from '../../../../../../../../supervision/src/app/business/services/countries-http.service';
import { map } from 'rxjs/operators';

export interface IDistancePriceModalData {
  distance_pricing: {
    distance_pricing_grid: IDistancePricingItem[];
  };
  isDisabled?: boolean;
}

interface IDistancePricingItem {
  tarif_code?: string;
  country_crossed?: {
    id: string;
    code: string;
  };
  pricing?: {
    threshold: number;
    base_price: number;
    unit_price: number;
    min_price: number;
    included_bunker_unit_price?: number;
    included_bunker_base_price?: number;
    included_bunker_min_price?: number;
  };
}

@Component({
  selector: 'mcit-distance-price-modal',
  templateUrl: './distance-price-modal.component.html',
  styleUrls: ['./distance-price-modal.component.scss']
})
export class McitDistancePriceModalComponent implements OnInit, OnDestroy {
  distancePricingForm: UntypedFormGroup;

  distancePricingItem: IDistancePricingItem;
  private subscriptions: Subscription[] = [];

  constructor(@Inject(MCIT_DIALOG_DATA) public modalData: IDistancePriceModalData, private dialogRef: McitDialogRef<McitDistancePriceModalComponent>, private formBuilder: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.distancePricingForm = this.formBuilder.group({
      _distance_pricing_item: this.formBuilder.group({
        tarif_code: [{ value: '', disabled: this.modalData.isDisabled }],
        country_crossed: [{ value: '', disabled: this.modalData.isDisabled }],
        pricing: this.formBuilder.group({
          threshold: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          base_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          unit_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          min_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          included_bunker_unit_price: [{ value: '', disabled: this.modalData.isDisabled }],
          included_bunker_base_price: [{ value: '', disabled: this.modalData.isDisabled }],
          included_bunker_min_price: [{ value: '', disabled: this.modalData.isDisabled }]
        })
      }),
      distance_pricing_grid: [this.modalData.distance_pricing?.distance_pricing_grid || [], Validators.required]
    });

    this.subscriptions.push(
      this.distancePricingForm.get('_distance_pricing_item').valueChanges.subscribe((next) => {
        if (next) {
          this.distancePricingItem = next;
        } else {
          this.distancePricingItem = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  doAddItem(): void {
    let distancePricingGrid = this.distancePricingForm.get('distance_pricing_grid').value;
    if (!distancePricingGrid) {
      distancePricingGrid = [];
    }
    if (!this.distancePricingItem.tarif_code) {
      delete this.distancePricingItem.tarif_code;
    }
    distancePricingGrid.push(this.distancePricingItem);

    this.distancePricingForm.get('distance_pricing_grid').setValue(distancePricingGrid);

    this.distancePricingItem = null;
    this.distancePricingForm.get('_distance_pricing_item').reset({ tarif_code: null });
    this.distancePricingForm.get('_distance_pricing_item').reset({ country_crossed: undefined });
    // Remove text from searchbox
    document.getElementById('country_crossed').getElementsByTagName('input')[0].value = '';
  }

  doDeleteItem(i: number): void {
    const distancePricingGrid = this.distancePricingForm.get('distance_pricing_grid').value;
    this.distancePricingForm.get('distance_pricing_grid').setValue(distancePricingGrid.filter((elem, index) => index !== i));
  }

  doSave(): void {
    this.dialogRef.close({
      distance_pricing_grid: this.distancePricingForm.get('distance_pricing_grid').value
    });
  }

  goBack(): void {
    this.dialogRef.close();
  }

  countryOnChange(event): void {
    if (event) {
      const dp = this.distancePricingForm.get('_distance_pricing_item');

      dp.patchValue({
        country_crossed: (dp.get('country_crossed').value, { id: event._id, code: event.code })
      });
    }
  }
}
