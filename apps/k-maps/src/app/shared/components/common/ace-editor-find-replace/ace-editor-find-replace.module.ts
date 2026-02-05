import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitAceEditorFindReplaceComponent } from './ace-editor-find-replace.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { McitTooltipModule } from '../tooltip/tooltip.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, McitTooltipModule],
  declarations: [McitAceEditorFindReplaceComponent],
  exports: [McitAceEditorFindReplaceComponent]
})
export class McitAceEditorFindReplaceModule {}
