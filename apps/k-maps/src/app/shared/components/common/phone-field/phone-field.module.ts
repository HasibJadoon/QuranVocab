import { NgModule } from '@angular/core';
import { McitPhoneFieldComponent } from './phone-field.component';
import { McitChooseCountryPhoneModalModule } from '../choose-country-phone-modal/choose-country-phone-modal.module';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitChooseCountryPhoneModalModule],
  declarations: [McitPhoneFieldComponent],
  exports: [McitPhoneFieldComponent]
})
export class McitPhoneFieldModule {}
