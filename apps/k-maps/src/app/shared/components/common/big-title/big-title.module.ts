import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitBigTitleComponent } from './big-title.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  declarations: [McitBigTitleComponent],
  exports: [McitBigTitleComponent]
})
export class McitBigTitleModule {}
