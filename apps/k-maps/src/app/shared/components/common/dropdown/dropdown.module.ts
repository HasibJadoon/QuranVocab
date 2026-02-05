import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { McitDropdown } from './dropdown.service';
import { McitDropdownContainerComponent } from './dropdown-container.component';
import { McitDropdownDirective } from './dropdown.directive';

@NgModule({
  imports: [CommonModule, OverlayModule, PortalModule],
  declarations: [McitDropdownContainerComponent, McitDropdownDirective],
  exports: [McitDropdownDirective],
  providers: [McitDropdown]
})
export class McitDropdownModule {}
