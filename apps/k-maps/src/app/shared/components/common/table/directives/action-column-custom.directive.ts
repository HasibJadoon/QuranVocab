import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitActionColumnCustom]'
})
export class McitActionColumnCustomDirective {
  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
