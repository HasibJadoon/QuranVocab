import { NgModule } from '@angular/core';
import { McitMeaningFieldComponent } from './meaning-field.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { McitMenuDropdownModule } from '../menu-dropdown/menu-dropdown.module';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitMenuDropdownModule],
  declarations: [McitMeaningFieldComponent],
  exports: [McitMeaningFieldComponent]
})
export class McitMeaningFieldModule {}
