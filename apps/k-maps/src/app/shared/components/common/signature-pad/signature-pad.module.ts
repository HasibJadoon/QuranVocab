import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitSignaturePadComponent } from './signature-pad.component';

@NgModule({
  imports: [CommonModule],
  declarations: [McitSignaturePadComponent],
  exports: [McitSignaturePadComponent]
})
export class McitSignaturePadModule {}
