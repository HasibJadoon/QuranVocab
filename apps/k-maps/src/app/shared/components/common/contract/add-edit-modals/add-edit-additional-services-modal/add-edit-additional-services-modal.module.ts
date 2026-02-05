import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../../../common/common.module';
import { McitDialogModule } from '../../../dialog/dialog.module';
import { McitFormsModule } from '../../../forms/forms.module';
import { AddEditAdditionalServicesModalComponent } from '@lib-shared/common/contract/add-edit-modals/add-edit-additional-services-modal/add-edit-additional-services-modal.component';
import { AddEditAdditionalServicesModalService } from '@lib-shared/common/contract/add-edit-modals/add-edit-additional-services-modal/add-edit-additional-services-modal.service';
import { AdditionalServiceLineParameterPipe } from '@lib-shared/common/contract/add-edit-modals/add-edit-additional-services-modal/pipe/additional-service-line-parameter.pipe';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, DragDropModule, McitCommonModule, McitFormsModule, McitDialogModule],
  declarations: [AddEditAdditionalServicesModalComponent, AdditionalServiceLineParameterPipe],
  providers: [AddEditAdditionalServicesModalService]
})
export class AddEditAdditionalServicesModalModule {}
