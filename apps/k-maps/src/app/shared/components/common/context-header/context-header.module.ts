import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitContextHeaderComponent } from './context-header.component';

@NgModule({
  imports: [TranslateModule, CommonModule, FormsModule],
  declarations: [McitContextHeaderComponent],
  exports: [McitContextHeaderComponent]
})
export class McitContextHeaderModule {}
