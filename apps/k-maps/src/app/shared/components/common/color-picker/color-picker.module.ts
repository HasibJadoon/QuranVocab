import { NgModule } from '@angular/core';
import { ColorPickerComponent } from './color-picker.component';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  declarations: [ColorPickerComponent],
  exports: [ColorPickerComponent]
})
export class McitColorPickerModule {}
