import { ViewContainerRef } from '@angular/core';
import { ConnectedPosition } from '@angular/cdk/overlay';

export enum McitAnimationTypeDropdown {
  NONE = 'none',
  UP_TO_DOWN = 'utd',
  LEFT_TO_RIGHT = 'ltr',
  CIRCULAR = 'cir'
}

export class McitDropdownConfig<D = any> {
  panelClass?: string;
  dropdownClass?: string;
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
  positions?: ConnectedPosition[];
  animationType?: McitAnimationTypeDropdown;
  flexibleDimensions?: boolean;
  lockedPosition?: boolean;
  viewportMargin?: number;
  size?: {
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
  };
}
