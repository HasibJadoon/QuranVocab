import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditSubscriptionModalComponent } from './edit-subscription-modal.component';
import { McitDialogModule } from '@lib-shared/common/dialog/dialog.module';
import { EditSubscriptionModalService } from './edit-subscription-modal.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitTagsInputModule } from '@lib-shared/common/tags-input/tags-input.module';
import { BeforeDayContextComponent } from './widgets/before-day-context/before-day-context.component';
import { NearContextComponent } from './widgets/near-context/near-context.component';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitFormsModule, McitCommonModule, McitDialogModule, McitTagsInputModule, McitTooltipModule],
  declarations: [EditSubscriptionModalComponent, BeforeDayContextComponent, NearContextComponent],
  providers: [EditSubscriptionModalService]
})
export class EditSubscriptionModalModule {}
