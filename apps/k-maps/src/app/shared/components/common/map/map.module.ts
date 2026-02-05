import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitMapComponent } from './map.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  declarations: [McitMapComponent],
  exports: [McitMapComponent]
})
export class McitMapModule {}
