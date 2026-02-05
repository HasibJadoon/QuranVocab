import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitEditTextModalComponent } from './edit-text-modal.component';
import { McitEditTextModalService } from './edit-text-modal.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitPhoneFieldModule } from '../phone-field/phone-field.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitDialogModule, McitFormsModule, McitPhoneFieldModule],
  declarations: [McitEditTextModalComponent],
  providers: [McitEditTextModalService]
})
export class McitEditTextModalModule {}
