import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '../../../common/common.module';
import { McitAddEditTransportRoadInspectionsModalComponent } from './add-edit-transport-road-inspections-modal.component';
import { McitAddEditTransportRoadInspectionsModalService } from './add-edit-transport-road-inspections-modal.service';
import { EditDefaultDepartureArrivalModalModule } from '../edit-default-departure-arrival-modal/edit-default-departure-arrival-modal.module';
import { McitTransportContractPricingModeModule } from '../pricing-mode-modals/transport-contract-pricing-mode.module';
import { MemberRoleFieldModule } from '../../member-role-field/member-role-field.module';
import { McitDateLocalFieldModule } from '../../../date-local-field/date-local-field.module';
import { McitFormsModule } from '../../../forms/forms.module';
import { McitTagsInputModule } from '../../../tags-input/tags-input.module';
import { TranslateModule } from '@ngx-translate/core';
import { UiSwitchModule } from 'ngx-ui-switch';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { McitChooseDateModalModule } from '../../../../common/choose-date-modal/choose-date-modal.module';
import { McitAddEditMeansRoadContractModalModule } from '../../../../common/contract/add-edit-modals/add-edit-means-road-contract-modal/add-edit-means-road-contract-modal.module';
import { McitDialogModule } from '../../../../common/dialog/dialog.module';
import { McitImportGridModule } from '../../../../common/import-grid/import-grid.module';
import { McitLayoutsModule } from '../../../../common/layouts/layouts.module';
import { McitPaginationModule } from '../../../../common/pagination/pagination.module';
import { McitQuestionModalModule } from '../../../../common/question-modal/question-modal.module';
import { McitSearchFieldModule } from '../../../../common/search/search.module';
import { McitSimpleAccordionModule } from '../../../../common/simple-accordion/simple-accordion.module';
import { McitTableModule } from '../../../../common/table/table.module';
import { McitTooltipModule } from '../../../../common/tooltip/tooltip.module';
import { McitUploadModule } from '../../../../common/upload';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { DerogatoryInfosServicePipe } from './pipes/derogatoryInfosService.pipe';
import { EditSubscriptionModalModule } from '../edit-subscription-modal/edit-subscription-modal.module';
import { AddEditAdditionalServicesModalModule } from '../add-edit-additional-services-modal/add-edit-additional-services-modal.module';
import { ServicesGridModalModule } from '../services-grid-modal/services-grid-modal.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, DragDropModule, McitCommonModule, McitSimpleAccordionModule, McitFormsModule, UiSwitchModule, TypeaheadModule],
  declarations: [McitAddEditTransportRoadInspectionsModalComponent, DerogatoryInfosServicePipe],
  providers: [McitAddEditTransportRoadInspectionsModalService]
})
export class McitAddEditTransportRoadInspectionsModalModule {}
