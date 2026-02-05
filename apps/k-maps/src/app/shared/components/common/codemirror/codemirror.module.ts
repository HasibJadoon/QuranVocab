import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { McitCodemirrorComponent } from './codemirror.component';

@NgModule({
  imports: [CommonModule, CodemirrorModule],
  declarations: [McitCodemirrorComponent],
  exports: [McitCodemirrorComponent]
})
export class McitCodemirrorModule {}
