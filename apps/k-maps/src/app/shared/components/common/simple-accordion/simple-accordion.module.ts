import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitSimpleAccordionComponent } from './simple-accordion.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule],
  declarations: [McitSimpleAccordionComponent],
  exports: [McitSimpleAccordionComponent]
})
export class McitSimpleAccordionModule {}
