import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../common/common.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitEditTranscodingModalComponent } from './edit-transcoding-modal.component';
import { McitEditTranscodingModalService } from './edit-transcoding-modal.service';
import { McitObjectSearchFieldModule } from '../object-search-field/object-search-field.module';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitCommonModule, McitDialogModule, McitObjectSearchFieldModule],
  declarations: [McitEditTranscodingModalComponent],
  providers: [McitEditTranscodingModalService]
})
export class McitEditTranscodingModalModule {}
