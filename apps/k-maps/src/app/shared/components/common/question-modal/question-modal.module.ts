import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitQuestionModalComponent } from './question-modal.component';
import { McitQuestionModalService } from './question-modal.service';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule],
  declarations: [McitQuestionModalComponent],
  providers: [McitQuestionModalService]
})
export class McitQuestionModalModule {}
