import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UploadZoneComponent } from './components/upload-zone.component';
import { UploadProgressComponent } from './components/upload-progress.component';
import { UploadComponent } from './components/upload.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  declarations: [UploadZoneComponent, UploadProgressComponent, UploadComponent],
  exports: [UploadComponent]
})
export class McitUploadModule {}
