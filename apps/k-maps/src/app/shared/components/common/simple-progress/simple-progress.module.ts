import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitSimpleProgressComponent } from './simple-progress.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  declarations: [McitSimpleProgressComponent],
  exports: [McitSimpleProgressComponent]
})
export class McitSimpleProgressModule {}
