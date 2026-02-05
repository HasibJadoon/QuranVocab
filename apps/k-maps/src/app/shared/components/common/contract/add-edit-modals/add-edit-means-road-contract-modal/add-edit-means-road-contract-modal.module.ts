import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../../../common/common.module';
import { McitDateLocalFieldModule } from '../../../date-local-field/date-local-field.module';
import { McitDialogModule } from '../../../dialog/dialog.module';
import { McitFormsModule } from '../../../forms/forms.module';
import { McitDayDistancePriceModalModule } from '../pricing-mode-modals/day-distance-price-modal/day-distance-price-modal.module';
import { McitDayPriceModalModule } from '../pricing-mode-modals/day-price-modal/day-price-modal.module';
import { McitDistancePriceModalModule } from '../pricing-mode-modals/distance-price-modal/distance-price-modal.module';
import { McitDistanceRangePriceModalModule } from '../pricing-mode-modals/distance-range-price-modal/distance-range-price-modal.module';
import { McitAddEditMeansRoadContractModalComponent } from './add-edit-means-road-contract-modal.component';
import { McitAddEditMeansRoadContractModalService } from './add-edit-means-road-contract-modal.service';
import { MemberRoleFieldModule } from '@lib-shared/common/contract/member-role-field/member-role-field.module';
import { McitTransportContractPricingModeModule } from '../pricing-mode-modals/transport-contract-pricing-mode.module';
import { UiSwitchModule } from 'ngx-ui-switch';
import { McitSimpleAccordionModule } from '@lib-shared/common/simple-accordion/simple-accordion.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    McitCommonModule,
    McitFormsModule,
    McitDialogModule,
    MemberRoleFieldModule,
    McitDateLocalFieldModule,
    McitDayPriceModalModule,
    McitDayDistancePriceModalModule,
    McitDistancePriceModalModule,
    McitDistanceRangePriceModalModule,
    McitTransportContractPricingModeModule,
    UiSwitchModule,
    McitSimpleAccordionModule,
    McitTooltipModule
  ],
  declarations: [McitAddEditMeansRoadContractModalComponent],
  providers: [McitAddEditMeansRoadContractModalService]
})
export class McitAddEditMeansRoadContractModalModule {}
