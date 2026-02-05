import { ViewContainerRef } from '@angular/core';

export class McitOffcanvasConfig<D = any> {
  panelClass?: string;
  offcanvasClass?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  backdropClass?: string;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  data?: D | null;
  viewContainerRef?: ViewContainerRef;
  position?: 'top' | 'bottom' | 'start' | 'end';
  enableBodyScroll?: boolean;
  style?: string;
  allowResize?: boolean;
  allowReposition?: ('top' | 'bottom' | 'start' | 'end')[];
}
