import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { McitFullCountryFieldComponent } from './full-country-field.component';
import { McitCommonModule } from '../common/common.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitCommonModule, TypeaheadModule],
  declarations: [McitFullCountryFieldComponent],
  exports: [McitFullCountryFieldComponent]
})
export class McitFullCountryFieldModule {}
