import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitVehicleTypeFieldComponent } from './vehicle-type-field.component';
import { McitFilterVehicleTypeContainerComponent } from './vehicle-type-filter/filter-vehicle-type-container.component';
import { McitFilterVehicleTypeContainerService } from './vehicle-type-filter/filter-vehicle-type-container.service';
import { CodificationSearchFieldModule } from '../../../../../fvl/src/app/shared/components/codification-search-field/codification-search-field.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { McitCommonModule } from '../common/common.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, CodificationSearchFieldModule, McitTooltipModule, McitCommonModule],
  declarations: [McitVehicleTypeFieldComponent, McitFilterVehicleTypeContainerComponent],
  exports: [McitVehicleTypeFieldComponent, McitFilterVehicleTypeContainerComponent],
  providers: [McitFilterVehicleTypeContainerService]
})
export class McitVehicleTypeFieldModule {}
