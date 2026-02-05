import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitMapRouteComponent } from './map-route.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitMapModule } from '../map/map.module';
import { McitLegendMapModule } from '../legend-map/legend-map.module';

@NgModule({
  imports: [CommonModule, TranslateModule, MatGridListModule, McitMapModule, McitLegendMapModule],
  declarations: [McitMapRouteComponent],
  exports: [McitMapRouteComponent]
})
export class McitMapRouteModule {}
