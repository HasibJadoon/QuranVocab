import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitPlaceFieldComponent } from './place-field.component';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { McitCommonModule } from '../common/common.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, TypeaheadModule, McitCommonModule],
  declarations: [McitPlaceFieldComponent],
  exports: [McitPlaceFieldComponent]
})
export class McitPlaceFieldModule {}
