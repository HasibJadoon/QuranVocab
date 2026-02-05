import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitGroupTableToolbarCustom]'
})
export class McitGroupTableToolbarCustomDirective {
  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
