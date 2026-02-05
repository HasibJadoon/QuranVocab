import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarcodeComponent } from './barcode.component';

@NgModule({
  imports: [CommonModule],
  declarations: [BarcodeComponent],
  exports: [BarcodeComponent]
})
export class BarcodeModule {}
