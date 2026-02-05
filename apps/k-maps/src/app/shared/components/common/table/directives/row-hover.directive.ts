import { Directive, OnDestroy, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';

const passiveListenerOptions = normalizePassiveListenerOptions({ passive: true });

@Directive({
  selector: '[mcitRowHover]'
})
export class McitRowHoverDirective implements OnDestroy {
  private trElements: HTMLElement[];
  private listener: EventListenerOrEventListenerObject;

  constructor(private viewRef: ViewContainerRef, private templateRef: TemplateRef<any>, private renderer: Renderer2) {
    const e = this.viewRef.createEmbeddedView(this.templateRef);
    this.trElements = e.rootNodes.filter((t: HTMLElement) => t.tagName === 'TR');

    this.listener = (event) => {
      if (event.type === 'mouseenter') {
        this.trElements.forEach((t) => this.renderer.addClass(t, 'hover'));
      } else if (event.type === 'mouseleave') {
        this.trElements.forEach((t) => this.renderer.removeClass(t, 'hover'));
      }
    };

    this.trElements.forEach((t) => {
      t.addEventListener('mouseenter', this.listener, passiveListenerOptions);
      t.addEventListener('mouseleave', this.listener, passiveListenerOptions);
    });
  }

  ngOnDestroy(): void {
    this.trElements.forEach((t) => {
      t.removeEventListener('mouseenter', this.listener);
      t.removeEventListener('mouseleave', this.listener);
    });
  }
}
