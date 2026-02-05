import { NgModule } from '@angular/core';
import { McitReadOnlyWrapperComponent } from './read-only-wrapper.component';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  exports: [McitReadOnlyWrapperComponent],
  declarations: [McitReadOnlyWrapperComponent]
})
export class McitReadOnlyWrapperModule {}
