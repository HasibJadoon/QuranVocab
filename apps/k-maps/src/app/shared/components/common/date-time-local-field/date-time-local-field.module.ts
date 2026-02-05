import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { McitDateTimeLocalFieldComponent } from './date-time-local-field.component';
import { McitDateHelperModule } from '../date-helper/date-helper.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, MatDatepickerModule, McitDateHelperModule, TypeaheadModule],
  declarations: [McitDateTimeLocalFieldComponent],
  exports: [McitDateTimeLocalFieldComponent]
})
export class McitDateTimeLocalFieldModule {}
