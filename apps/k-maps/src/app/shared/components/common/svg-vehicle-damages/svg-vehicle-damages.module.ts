import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { McitSvgMapModule } from '../svg-map/svg-map.module';
import { McitExternalVehicleSvgComponent } from './external-vehicle-svg/external-vehicle-svg.component';
import { McitInternalVehicleSvgComponent } from './internal-vehicle-svg/internal-vehicle-svg.component';
import { McitSvgVehicleDamageService } from './svg-vehicle-damages.service';
import { McitInternalExternalVehicleSvgComponent } from './internal-external-vehicle-svg/internal-external-vehicle-svg.component';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, McitSvgMapModule],
  providers: [McitSvgVehicleDamageService],
  declarations: [McitExternalVehicleSvgComponent, McitInternalVehicleSvgComponent, McitInternalExternalVehicleSvgComponent],
  exports: [McitExternalVehicleSvgComponent, McitInternalVehicleSvgComponent, McitInternalExternalVehicleSvgComponent]
})
export class McitSvgVehicleDamagesModule {}
