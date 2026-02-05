import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitActionGroupRowCustom]'
})
export class McitActionGroupRowCustomDirective {
  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
