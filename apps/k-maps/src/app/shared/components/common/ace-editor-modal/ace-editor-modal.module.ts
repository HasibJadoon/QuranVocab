import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitAceEditorModalService } from './ace-editor-modal.service';
import { McitCommonModule } from '../common/common.module';
import { McitAceEditorModalComponent } from './ace-editor-modal.component';
import { McitAceEditorModule } from '../ace-editor/ace-editor.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitCommonModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitAceEditorModule],
  declarations: [McitAceEditorModalComponent],
  providers: [McitAceEditorModalService]
})
export class McitAceEditorModalModule {}
