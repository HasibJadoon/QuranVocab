import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitVehicleMovingFieldComponent } from './vehicle-moving-field.component';
import { UiSwitchModule } from 'ngx-ui-switch';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, UiSwitchModule],
  declarations: [McitVehicleMovingFieldComponent],
  exports: [McitVehicleMovingFieldComponent]
})
export class McitVehicleMovingFieldModule {}
