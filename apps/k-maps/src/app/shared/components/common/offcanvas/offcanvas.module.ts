import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { McitOffcanvas } from './offcanvas.service';
import { McitOffcanvasContainerComponent } from './offcanvas-container.component';
import { McitOffcanvasDirective } from './offcanvas.directive';

@NgModule({
  imports: [CommonModule, OverlayModule, PortalModule],
  declarations: [McitOffcanvasContainerComponent, McitOffcanvasDirective],
  exports: [McitOffcanvasDirective],
  providers: [McitOffcanvas]
})
export class McitOffcanvasModule {}
