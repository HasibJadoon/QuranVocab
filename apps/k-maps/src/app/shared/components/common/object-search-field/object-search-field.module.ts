import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { McitCommonModule } from '../common/common.module';
import { McitObjectSearchFieldComponent } from './object-search-field.component';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitCommonModule, TypeaheadModule],
  declarations: [McitObjectSearchFieldComponent],
  exports: [McitObjectSearchFieldComponent]
})
export class McitObjectSearchFieldModule {}
