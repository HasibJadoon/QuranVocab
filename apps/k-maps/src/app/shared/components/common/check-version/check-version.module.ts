import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitCheckVersionComponent } from './check-version.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  declarations: [McitCheckVersionComponent],
  exports: [McitCheckVersionComponent]
})
export class McitCheckVersionModule {}
