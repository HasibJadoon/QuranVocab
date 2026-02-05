import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitAceEditorComponent } from './ace-editor.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [McitAceEditorComponent],
  exports: [McitAceEditorComponent]
})
export class McitAceEditorModule {}
