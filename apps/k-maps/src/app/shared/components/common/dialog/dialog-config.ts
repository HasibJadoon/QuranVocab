import { ViewContainerRef } from '@angular/core';

export class McitDialogConfig<D = any> {
  panelClass?: string;
  dialogClass?: string;
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
  disableDrag?: boolean;
}
