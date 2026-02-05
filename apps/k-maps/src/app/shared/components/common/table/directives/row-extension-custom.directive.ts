import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[mcitRowExtensionCustom]'
})
export class McitRowExtensionCustomDirective {
  constructor(public readonly viewRef: ViewContainerRef, public readonly templateRef: TemplateRef<any>) {}
}
