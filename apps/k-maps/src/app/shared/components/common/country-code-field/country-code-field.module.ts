import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

import { McitCommonModule } from '../common/common.module';
import { McitFormsModule } from '../forms/forms.module';
import { McitCountryCodeFieldComponent } from './country-code-field.component';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitCommonModule, TypeaheadModule],
  declarations: [McitCountryCodeFieldComponent],
  exports: [McitCountryCodeFieldComponent]
})
export class McitCountryCodeFieldModule {}
