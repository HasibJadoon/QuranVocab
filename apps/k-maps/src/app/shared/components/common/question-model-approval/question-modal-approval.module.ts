import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitQuestionModalApprovalComponent } from './question-model-approval.component';
import { McitQuestionApprovalModalService } from './question-modal-approval.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, FormsModule],
  declarations: [McitQuestionModalApprovalComponent],
  providers: [McitQuestionApprovalModalService]
})
export class McitQuestionApprovalModalModule {}
