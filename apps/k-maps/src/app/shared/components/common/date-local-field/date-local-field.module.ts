import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';

import { McitCommonModule } from '../common/common.module';
import { McitDateHelperModule } from '../date-helper/date-helper.module';
import { McitFormsModule } from '../forms/forms.module';
import { McitDateLocalFieldComponent } from './date-local-field.component';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, MatDatepickerModule, McitDateHelperModule, McitCommonModule],
  declarations: [McitDateLocalFieldComponent],
  exports: [McitDateLocalFieldComponent]
})
export class McitDateLocalFieldModule {}
