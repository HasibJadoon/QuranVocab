import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitVehicleIdFieldComponent } from './vehicle-id-field.component';
import { McitMenuDropdownModule } from '../menu-dropdown/menu-dropdown.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitMenuDropdownModule],
  declarations: [McitVehicleIdFieldComponent],
  exports: [McitVehicleIdFieldComponent]
})
export class McitVehicleIdFieldModule {}
