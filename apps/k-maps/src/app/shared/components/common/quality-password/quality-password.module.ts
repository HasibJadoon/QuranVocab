import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitQualityPasswordComponent } from './quality-password.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  declarations: [McitQualityPasswordComponent],
  exports: [McitQualityPasswordComponent]
})
export class McitQualityPasswordModule {}
