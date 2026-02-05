import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { McitDateLocalFieldModule } from '@lib-shared/common/date-local-field/date-local-field.module';
import { FixedPriceModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/fixed-price-modal/fixed-price-modal.component';
import { KmPriceModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/km-price-modal/km-price-modal.component';
import { PricingClientModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/pricing-client-modal/pricing-client-modal.component';
import { PricingGridModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/pricing-grid-modal/pricing-grid-modal.component';
import { RangePriceModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/range-price-modal/range-price-modal.component';
import { TripCategoryFixedModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/trip-categorie-fixed-modal/trip-categorie-fixed-modal.component';
import { TripCategoryKmModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/trip-categorie-km-modal/trip-categorie-km-modal.component';
import { VinCategoryFixedModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/vin-categorie-fixed-modal/vin-categorie-fixed-modal.component';
import { VinCategoryKmModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/vin-categorie-km-modal/vin-categorie-km-modal.component';
import { TripCategoryRangeModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/trip-categorie-range-modal/trip-categorie-range-modal.component';
import { VinCategoryRangedModalComponent } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/vin-categorie-ranged-modal/vin-categorie-ranged-modal.component';
import { UiSwitchModule } from 'ngx-ui-switch';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitCommonModule, McitFormsModule, McitDateLocalFieldModule, UiSwitchModule],
  declarations: [
    FixedPriceModalComponent,
    KmPriceModalComponent,
    PricingClientModalComponent,
    PricingGridModalComponent,
    RangePriceModalComponent,
    TripCategoryFixedModalComponent,
    TripCategoryKmModalComponent,
    VinCategoryFixedModalComponent,
    VinCategoryKmModalComponent,
    VinCategoryRangedModalComponent,
    TripCategoryRangeModalComponent
  ]
})
export class McitTransportContractPricingModeModule {}
