import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitColumnCustom]'
})
export class McitColumnCustomDirective {
  @Input('mcitColumnCustom')
  elementKey: string;

  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
