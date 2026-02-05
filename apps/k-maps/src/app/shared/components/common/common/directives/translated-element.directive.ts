import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitTranslatedElement]'
})
export class McitTranslatedElementDirective {
  @Input('mcitTranslatedElement')
  public elementKey: string;

  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
