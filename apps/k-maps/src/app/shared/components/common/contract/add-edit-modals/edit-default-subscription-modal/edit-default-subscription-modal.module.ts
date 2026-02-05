import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { EditDefaultSubscriptionModalComponent } from '@lib-shared/common/contract/add-edit-modals/edit-default-subscription-modal/edit-default-subscription-modal.component';
import { EditDefaultSubscriptionModalService } from '@lib-shared/common/contract/add-edit-modals/edit-default-subscription-modal/edit-default-subscription-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitCommonModule, McitFormsModule],
  declarations: [EditDefaultSubscriptionModalComponent],
  providers: [EditDefaultSubscriptionModalService]
})
export class EditDefaultSubscriptionModalModule {}
