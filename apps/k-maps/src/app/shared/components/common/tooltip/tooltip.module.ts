import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDropdownModule } from '../dropdown/dropdown.module';
import { McitCommonModule } from '../common/common.module';
import { McitTooltipDirective } from './tooltip.directive';
import { McitTooltipDropdownComponent } from './tooltip-dropdown.component';

@NgModule({
  imports: [CommonModule, McitDropdownModule, McitCommonModule],
  declarations: [McitTooltipDirective, McitTooltipDropdownComponent],
  exports: [McitTooltipDirective]
})
export class McitTooltipModule {}
