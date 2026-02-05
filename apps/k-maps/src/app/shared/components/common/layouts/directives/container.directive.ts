import { Directive, ElementRef, OnDestroy } from '@angular/core';
import { McitContainerService } from '../container.service';

@Directive({
  selector: '[mcitContainer]'
})
export class McitContainerDirective implements OnDestroy {
  constructor(private containerService: McitContainerService, private elementRef: ElementRef) {
    this.containerService.registerContainer(this.elementRef);
  }

  ngOnDestroy(): void {
    this.containerService.unregisterContainer(this.elementRef);
  }
}
