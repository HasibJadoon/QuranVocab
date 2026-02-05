import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitAddEditTransportRoadContractModalComponent } from '@lib-shared/common/contract/add-edit-modals/add-edit-transport-road-contract/add-edit-transport-road-contract-modal.component';
import { McitAddEditTransportRoadContractModalService } from '@lib-shared/common/contract/add-edit-modals/add-edit-transport-road-contract/add-edit-transport-road-contract-modal.service';
import { ValorizationModalComponent } from '@lib-shared/common/contract/add-edit-modals/add-edit-transport-road-contract/valorization-modal/valorization-modal.component';
import { EditDefaultDepartureArrivalModalModule } from '@lib-shared/common/contract/add-edit-modals/edit-default-departure-arrival-modal/edit-default-departure-arrival-modal.module';
import { McitTransportContractPricingModeModule } from '@lib-shared/common/contract/add-edit-modals/pricing-mode-modals/transport-contract-pricing-mode.module';
import { MemberRoleFieldModule } from '@lib-shared/common/contract/member-role-field/member-role-field.module';
import { McitDateLocalFieldModule } from '@lib-shared/common/date-local-field/date-local-field.module';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { McitTagsInputModule } from '@lib-shared/common/tags-input/tags-input.module';
import { TranslateModule } from '@ngx-translate/core';
import { UiSwitchModule } from 'ngx-ui-switch';
import { McitSimpleAccordionModule } from '@lib-shared/common/simple-accordion/simple-accordion.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { EditDefaultSubscriptionModalModule } from '@lib-shared/common/contract/add-edit-modals/edit-default-subscription-modal/edit-default-subscription-modal.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    McitCommonModule,
    McitFormsModule,
    McitTagsInputModule,
    MemberRoleFieldModule,
    McitDateLocalFieldModule,
    McitTransportContractPricingModeModule,
    EditDefaultDepartureArrivalModalModule,
    EditDefaultSubscriptionModalModule,
    UiSwitchModule,
    McitSimpleAccordionModule,
    McitTooltipModule
  ],
  declarations: [McitAddEditTransportRoadContractModalComponent, ValorizationModalComponent],
  providers: [McitAddEditTransportRoadContractModalService]
})
export class McitAddEditTransportRoadContractModalModule {}
