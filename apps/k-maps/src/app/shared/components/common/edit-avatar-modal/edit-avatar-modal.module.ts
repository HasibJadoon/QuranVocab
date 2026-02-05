import { NgModule } from '@angular/core';
import { ImageCropperModule } from 'ngx-img-cropper';
import { McitEditAvatarModalComponent } from './edit-avatar-modal.component';
import { McitEditAvatarModalService } from './edit-avatar-modal.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, ImageCropperModule],
  declarations: [McitEditAvatarModalComponent],
  providers: [McitEditAvatarModalService]
})
export class McitEditAvatarModalModule {}
