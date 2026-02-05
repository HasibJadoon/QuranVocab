import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McitControlStatusDirective } from './directives/control-status.directive';
import { McitDisableControlDirective } from './directives/disable-control.directive';
import { McitUppercaseDirective } from './directives/uppercase.directive';
import { McitDisableControlNoEventDirective } from './directives/disable-control-no-event.directive';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [McitControlStatusDirective, McitDisableControlDirective, McitUppercaseDirective, McitDisableControlNoEventDirective],
  exports: [McitControlStatusDirective, McitDisableControlDirective, McitUppercaseDirective, McitDisableControlNoEventDirective]
})
export class McitFormsModule {}
