import { Directive } from '@angular/core';
import { McitTableOptionsComponent } from '../options/table-options.component';

@Directive({
  selector: '[mcitTableToolbar]'
})
export class McitTableToolbarDirective<E> {
  constructor() {}
}
