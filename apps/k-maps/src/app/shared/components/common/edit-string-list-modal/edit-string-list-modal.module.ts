import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../common/common.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitEditStringListModalComponent } from './edit-string-list-modal.component';
import { McitEditStringListModalService } from './edit-string-list-modal.service';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitCommonModule, McitDialogModule],
  declarations: [McitEditStringListModalComponent],
  providers: [McitEditStringListModalService]
})
export class McitEditStringListModalModule {}
