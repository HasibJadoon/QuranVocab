import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitLegendMapComponent } from './legend-map.component';

@NgModule({
  imports: [CommonModule, TranslateModule],
  exports: [McitLegendMapComponent],
  declarations: [McitLegendMapComponent]
})
export class McitLegendMapModule {}
