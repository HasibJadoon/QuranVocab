import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitItemCustom]'
})
export class McitItemCustomDirective {
  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
