import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '../dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitChangeStringModalComponent } from './change-string-modal.component';
import { McitChangeStringModalService } from './change-string-modal.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitFormsModule, ReactiveFormsModule, FormsModule],
  declarations: [McitChangeStringModalComponent],
  providers: [McitChangeStringModalService]
})
export class McitChangeStringModalModule {}
