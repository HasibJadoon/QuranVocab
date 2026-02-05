import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxD3Service } from '@katze/ngx-d3';
import { McitSvgMapComponent } from './svg-map.component';

@NgModule({
  imports: [CommonModule],
  providers: [NgxD3Service],
  declarations: [McitSvgMapComponent],
  exports: [McitSvgMapComponent]
})
export class McitSvgMapModule {}
