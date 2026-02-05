import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitQuestionDiscardModalService } from './question-discard-modal.service';
import { McitQuestionDiscardModalComponent } from './question-discard-modal.component';
import { McitDialogModule } from '../dialog/dialog.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitQuestionDiscardModalComponent],
  providers: [McitQuestionDiscardModalService]
})
export class McitQuestionDiscardModalModule {}
