import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { EditDefaultDepartureArrivalModalService } from '@lib-shared/common/contract/add-edit-modals/edit-default-departure-arrival-modal/edit-default-departure-arrival-modal.service';
import { EditDefaultDepartureArrivalModalComponent } from '@lib-shared/common/contract/add-edit-modals/edit-default-departure-arrival-modal/edit-default-departure-arrival-modal.component';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitCommonModule, McitFormsModule],
  declarations: [EditDefaultDepartureArrivalModalComponent],
  providers: [EditDefaultDepartureArrivalModalService]
})
export class EditDefaultDepartureArrivalModalModule {}
