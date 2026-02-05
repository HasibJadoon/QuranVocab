import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitEditTextAreaModalComponent } from './edit-text-area-modal.component';
import { McitEditTextAreaModalService } from './edit-text-area-modal.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitDialogModule, McitFormsModule],
  declarations: [McitEditTextAreaModalComponent],
  providers: [McitEditTextAreaModalService]
})
export class McitEditTextAreaModalModule {}
