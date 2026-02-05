import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitDialog } from './dialog.service';
import { McitDialogContainerComponent } from './dialog-container.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { McitDialogDirective } from './dialog.directive';

@NgModule({
  imports: [CommonModule, OverlayModule, PortalModule, DragDropModule],
  declarations: [McitDialogContainerComponent, McitDialogDirective],
  exports: [McitDialogDirective],
  providers: [McitDialog]
})
export class McitDialogModule {}
