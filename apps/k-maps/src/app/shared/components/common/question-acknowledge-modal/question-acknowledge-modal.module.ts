import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitQuestionAcknowledgeModalComponent } from './question-acknowledge-modal.component';
import { McitQuestionAcknowledgeModalService } from './question-acknowledge-modal.service';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, ReactiveFormsModule],
  declarations: [McitQuestionAcknowledgeModalComponent],
  providers: [McitQuestionAcknowledgeModalService]
})
export class McitQuestionAcknowledgeModalModule {}
