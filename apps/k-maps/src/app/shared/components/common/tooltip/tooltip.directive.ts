import { Directive, ElementRef, Inject, InjectionToken, Input, NgZone, OnDestroy, OnInit, Optional, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { McitDropdown } from '../dropdown/dropdown.service';
import { McitDropdownRef } from '../dropdown/dropdown-ref';
import { McitTooltipDropdownComponent } from './tooltip-dropdown.component';
import { McitAnimationTypeDropdown } from '../dropdown/dropdown-config';
import { ConnectedPosition } from '@angular/cdk/overlay';
import * as lodash from 'lodash';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';

export type TooltipPosition = 'left' | 'right' | 'top' | 'bottom';
export type TooltipSize = 'normal' | 'large' | 'small';

type TooltipVisibility = 'initial' | 'visible' | 'hidden';

const passiveListenerOptions = normalizePassiveListenerOptions({ passive: true });

export interface McitTooltipDefaultOptions {
  showDelay: number;
  hideDelay: number;
  position?: TooltipPosition;
  size: TooltipSize;
}

export const MCIT_TOOLTIP_DEFAULT_OPTIONS = new InjectionToken<McitTooltipDefaultOptions>('MCIT_TOOLTIP_DEFAULT_OPTIONS');

const leftPositions: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center'
  },
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'bottom'
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'top'
  }
];

const rightPositions: ConnectedPosition[] = [
  {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center'
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'bottom'
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'top'
  }
];

const topPositions: ConnectedPosition[] = [
  {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom'
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom'
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom'
  }
];

const bottomPositions: ConnectedPosition[] = [
  {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top'
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top'
  },
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top'
  }
];

@Directive({
  selector: '[mcitTooltip]',
  exportAs: 'mcit-tooltip'
})
export class McitTooltipDirective implements OnInit, OnDestroy, OnChanges {
  @Input('mcitTooltip')
  tooltip: string | TemplateRef<any>;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitTooltipContext')
  tooltipContext: any;

  @Input('mcitTooltipPosition')
  position: TooltipPosition = 'top';

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitTooltipShowDelay')
  showDelay: number;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitTooltipHideDelay')
  hideDelay: number;

  @Input('mcitTooltipDisabled')
  disabled = false;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitTooltipDisabledMessage')
  disabledMessage: string | TemplateRef<any>;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitTooltipClass')
  tooltipClass = '';

  @Input('mcitTooltipSize')
  size: TooltipSize = 'normal';

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitTooltipShowIfTruncated')
  showIfTruncated = false;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitRefreshOnClick')
  refreshOnClick = false;

  private showTimeoutId: number;
  private hideTimeoutId: number;
  private visibility: TooltipVisibility = 'initial';
  private dropdownRef: McitDropdownRef<McitTooltipDropdownComponent>;
  private defaultOptions: McitTooltipDefaultOptions;
  private passiveListeners = new Map<string, EventListenerOrEventListenerObject>();
  private handleKeydown = null;
  private disabledNotTruncated = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private elementRef: ElementRef,
    private dropdown: McitDropdown,
    private focusMonitor: FocusMonitor,
    private ngZone: NgZone,
    @Optional()
    @Inject(MCIT_TOOLTIP_DEFAULT_OPTIONS)
    defaultOptions: McitTooltipDefaultOptions
  ) {
    this.defaultOptions = lodash.defaultsDeep({}, defaultOptions || {}, {
      showDelay: 0,
      hideDelay: 0
    });

    if (this.defaultOptions) {
      if (this.defaultOptions.position) {
        this.position = this.defaultOptions.position;
      }

      if (this.defaultOptions.showDelay) {
        this.showDelay = this.defaultOptions.showDelay;
      }
      if (this.defaultOptions.hideDelay) {
        this.hideDelay = this.defaultOptions.hideDelay;
      }
      if (this.defaultOptions.size) {
        this.size = this.defaultOptions.size;
      }
    }

    this.subscriptions.push(
      focusMonitor.monitor(elementRef).subscribe((origin) => {
        // Note that the focus monitor runs outside the Angular zone.
        if (!origin) {
          this.ngZone.run(() => this.hide(0));
        } else if (origin === 'keyboard') {
          this.ngZone.run(() => this.show());
        }
      })
    );

    this.handleKeydown = (event: KeyboardEvent) => {
      if (this.isTooltipVisible() && event.keyCode === ESCAPE && !hasModifierKey(event)) {
        event.preventDefault();
        event.stopPropagation();
        this.ngZone.run(() => this.hide(0));
      }
    };

    ngZone.runOutsideAngular(() => {
      elementRef.nativeElement.addEventListener('keydown', this.handleKeydown);
    });
  }

  ngOnInit(): void {
    this.passiveListeners.set('mouseenter', () => this.show()).set('mouseleave', () => this.hide());

    this.passiveListeners.forEach((listener, event) => {
      this.elementRef.nativeElement.addEventListener(event, listener, passiveListenerOptions);
    });

    this.subscriptions.push(
      timer(0, 500)
        .pipe(
          filter(() => this.showIfTruncated),
          map(() => this.elementRef.nativeElement.scrollWidth <= this.elementRef.nativeElement.clientWidth),
          distinctUntilChanged(),
          tap((disable) => (this.disabledNotTruncated = disable))
        )
        .subscribe()
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.refreshOnClick) {
      const tooltipChanges = 'tooltip' in changes ? changes['tooltip'] : null;
      const isValueChanged = tooltipChanges?.currentValue !== tooltipChanges?.previousValue;
      if (tooltipChanges && !tooltipChanges.isFirstChange() && isValueChanged) {
        this.refresh();
      }
    }
  }

  ngOnDestroy(): void {
    const nativeElement = this.elementRef.nativeElement;

    if (this.showTimeoutId) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    if (this.dropdownRef) {
      this.dropdownRef.close();
      this.dropdownRef = null;
    }

    nativeElement.removeEventListener('keydown', this.handleKeydown);
    this.passiveListeners.forEach((listener, event) => {
      nativeElement.removeEventListener(event, listener, passiveListenerOptions);
    });
    this.passiveListeners.clear();

    this.subscriptions.forEach((data) => data.unsubscribe());

    this.focusMonitor.stopMonitoring(nativeElement);
  }

  private getPosition(): ConnectedPosition[] {
    switch (this.position) {
      case 'left':
        return lodash.concat([], leftPositions, rightPositions);
      case 'right':
        return lodash.concat([], rightPositions, leftPositions);
      case 'bottom':
        return lodash.concat([], bottomPositions, topPositions);
      default:
        return lodash.concat([], topPositions, bottomPositions);
    }
  }

  show(delay: number = this.showDelay): void {
    if (((this.disabled || this.disabledNotTruncated) && !this.disabledMessage) || !this.tooltip || (this.isTooltipVisible() && !this.showTimeoutId && !this.hideTimeoutId)) {
      return;
    }

    if (this.dropdownRef != null) {
      this.dropdownRef.close();
      this.dropdownRef = null;
    }

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    this.showTimeoutId = window.setTimeout(() => {
      this.visibility = 'visible';
      this.showTimeoutId = null;

      this.dropdownRef = this.dropdown.open(McitTooltipDropdownComponent, this.elementRef, {
        hasBackdrop: false,
        disableClose: false,
        positions: this.getPosition(),
        animationType: McitAnimationTypeDropdown.NONE,
        autoFocus: false,
        restoreFocus: false,
        data: {
          message: (this.disabled || this.disabledNotTruncated) && this.disabledMessage ? this.disabledMessage : this.tooltip,
          context: this.tooltipContext,
          tooltipClass: this.tooltipClass,
          position: this.position,
          size: this.size
        }
      });

      this.dropdownRef.afterClosed().subscribe((next) => {
        this.visibility = 'hidden';
        this.hideTimeoutId = null;
        this.dropdownRef = null;
      });
    }, delay);
  }

  hide(delay: number = this.hideDelay): void {
    if (this.showTimeoutId) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }

    if (this.dropdownRef == null) {
      return;
    }

    this.hideTimeoutId = window.setTimeout(() => {
      this.visibility = 'hidden';
      this.hideTimeoutId = null;

      if (this.dropdownRef != null) {
        this.dropdownRef.close();
        this.dropdownRef = null;
      }
    }, delay);
  }

  refresh(): void {
    this.visibility = 'hidden';
    if (this.dropdownRef != null) {
      this.dropdownRef.close();
      this.dropdownRef = null;
    }
    this.show();
  }

  toggle(): void {
    if (this.isTooltipVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  isTooltipVisible(): boolean {
    return this.visibility === 'visible';
  }
}
