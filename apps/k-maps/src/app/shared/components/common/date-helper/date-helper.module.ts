import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { McitAutoTouchUiDirective } from './auto-touch-ui.directive';

@NgModule({
  imports: [CommonModule, MatDatepickerModule],
  declarations: [McitAutoTouchUiDirective],
  exports: [McitAutoTouchUiDirective]
})
export class McitDateHelperModule {}
