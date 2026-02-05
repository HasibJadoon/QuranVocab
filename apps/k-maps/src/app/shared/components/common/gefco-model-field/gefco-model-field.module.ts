import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitGefcoModelFieldComponent } from './gefco-model-field.component';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { McitCommonModule } from '../common/common.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitTooltipModule, McitCommonModule, TypeaheadModule],
  declarations: [McitGefcoModelFieldComponent],
  exports: [McitGefcoModelFieldComponent],
  providers: []
})
export class McitGefcoModelFieldModule {}
