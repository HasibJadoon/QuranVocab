import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitTrafficLightComponent } from './traffic-light.component';

@NgModule({
  imports: [CommonModule],
  declarations: [McitTrafficLightComponent],
  exports: [McitTrafficLightComponent]
})
export class McitTrafficLightModule {}
