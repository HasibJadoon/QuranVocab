import { AfterViewInit, Component, ComponentRef, ElementRef, EmbeddedViewRef, EventEmitter, HostBinding, HostListener, Inject, OnDestroy, OnInit, Optional, ViewChild, ViewEncapsulation } from '@angular/core';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { Observable, Subject } from 'rxjs';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { McitGlobalDialog } from '../dialog/global-dialog.service';
import { DOCUMENT } from '@angular/common';
import { OverlayRef } from '@angular/cdk/overlay';
import { McitOffcanvasConfig } from './offcanvas-config';

@Component({
  selector: 'mcit-offcanvas-overlay-container',
  templateUrl: './offcanvas-container.component.html',
  styleUrls: ['./offcanvas-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('offcanvasContainer', [
      state('void', style({ opacity: 0 })),
      // START
      state('start_void, start_exit', style({ opacity: 0, transform: 'translateX(-100%)' })),
      state('start_enter', style({ transform: 'none' })),
      transition('start_void => start_enter', [animate('0.3s ease', style({ transform: 'none', opacity: 1 }))]),
      transition('start_enter => start_exit', [animate('0.3s ease', style({ opacity: 0, transform: 'translateX(-100%)' }))]),
      // END
      state('end_void, end_exit', style({ opacity: 0, transform: 'translateX(100%)' })),
      state('end_enter', style({ transform: 'none' })),
      transition('end_void => end_enter', [animate('0.3s ease', style({ transform: 'none', opacity: 1 }))]),
      transition('end_enter => end_exit', [animate('0.3s ease', style({ opacity: 0, transform: 'translateX(100%)' }))]),
      // TOP
      state('top_void, top_exit', style({ opacity: 0, transform: 'translateY(-100%)' })),
      state('top_enter', style({ transform: 'none' })),
      transition('top_void => top_enter', [animate('0.3s ease', style({ transform: 'none', opacity: 1 }))]),
      transition('top_enter => top_exit', [animate('0.3s ease', style({ opacity: 0, transform: 'translateY(-100%)' }))]),
      // BOTTOM
      state('bottom_void, bottom_exit', style({ opacity: 0, transform: 'translateY(100%)' })),
      state('bottom_enter', style({ transform: 'none' })),
      transition('bottom_void => bottom_enter', [animate('0.3s ease', style({ transform: 'none', opacity: 1 }))]),
      transition('bottom_enter => bottom_exit', [animate('0.3s ease', style({ opacity: 0, transform: 'translateY(100%)' }))])
    ]),
    trigger('offcanvasBackdrop', [
      state('void, exit', style({ opacity: 0 })),
      state('enter', style({ transform: 'none' })),
      transition('* => enter', [animate('0.3s ease', style({ opacity: 1 }))]),
      transition('* => void, * => exit', [animate('0.3s ease', style({ opacity: 0 }))])
    ])
  ],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    style: 'display:block',
    tabindex: '-1',
    'aria-modal': 'true',
    '[attr.role]': 'config.role',
    '[attr.aria-labelledby]': 'config.ariaLabel',
    '[attr.aria-label]': 'config.ariaLabel',
    '[attr.aria-describedby]': 'config.ariaDescribedBy'
  }
})
export class McitOffcanvasContainerComponent extends BasePortalOutlet implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CdkPortalOutlet, { static: true }) _portalOutlet: CdkPortalOutlet;

  offcanvasClass: string;
  hasBackdrop: boolean;
  showBackdrop: boolean;
  backdropClass: string;
  position: 'start' | 'end' | 'top' | 'bottom';
  state: string;
  originalStyle: string;
  style: string;
  allowResize: boolean;
  resizeOffset: number = 0;
  allowReposition: ('start' | 'end' | 'top' | 'bottom')[];

  @HostBinding('class')
  get hostClass(): string {
    return this.config.enableBodyScroll ? '' : 'modal';
  }

  readonly animationStateChanged = new EventEmitter<AnimationEvent>();

  private readonly backdropEventsSubject = new Subject<void>();
  private readonly escEventsSubject = new Subject<void>();
  private focusTrap: FocusTrap;
  private elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;
  private resizePreviousValue: null | number = null;
  private resizeEventHandlers: {
    mouseUp: (e: MouseEvent) => void;
    mouseMove: (e: MouseEvent) => void;
  } | null = null;

  constructor(
    private elementRef: ElementRef,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private globalDialog: McitGlobalDialog,
    @Optional() @Inject(DOCUMENT) private document: Document,
    private overlayRef: OverlayRef,
    private config: McitOffcanvasConfig
  ) {
    super();
  }

  ngOnInit(): void {
    this.offcanvasClass = this.config.offcanvasClass;
    this.hasBackdrop = this.config.hasBackdrop;
    this.showBackdrop = true;
    this.backdropClass = this.config.backdropClass ?? 'mcit-offcanvas-backdrop';
    this.position = this.config.position ?? 'start';
    this.style = this.config.style ?? '';
    this.originalStyle = this.style;
    this.allowResize = this.config.allowResize ?? false;
    this.allowReposition = this.config.allowReposition ?? [];

    this.state = this.position + '_void';

    if (!this.config.enableBodyScroll) {
      this.globalDialog.setScrollbar();

      this.overlayRef.detachments().subscribe(() => {
        this.globalDialog.resetScrollbar();
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.state = this.position + '_enter';
    }, 0);
  }

  ngOnDestroy(): void {
    this.removeHandlers();
  }

  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    this.savePreviouslyFocusedElement();
    return this._portalOutlet.attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    this.savePreviouslyFocusedElement();
    return this._portalOutlet.attachTemplatePortal(portal);
  }

  @HostListener('click', ['$event'])
  onClick(event: any): void {
    if (event.target !== this.elementRef.nativeElement) {
      return;
    }
    this.backdropEventsSubject.next();
  }

  @HostListener('window:keydown.esc', ['$event'])
  onEsc(event: any): void {
    if (event.keyCode === 27) {
      event.preventDefault();
    }
    this.escEventsSubject.next();
  }

  backdropEvents(): Observable<void> {
    return this.backdropEventsSubject.asObservable();
  }

  escEvents(): Observable<void> {
    return this.escEventsSubject.asObservable();
  }

  private trapFocus(): void {
    if (this.config.autoFocus) {
      if (!this.focusTrap) {
        this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
      }

      this.focusTrap.focusInitialElementWhenReady();
    }
  }

  private restoreFocus(): void {
    const toFocus = this.elementFocusedBeforeDialogWasOpened;

    if (this.config.restoreFocus && toFocus && typeof toFocus.focus === 'function') {
      toFocus.focus();
    }

    if (this.focusTrap) {
      this.focusTrap.destroy();
    }
  }

  private savePreviouslyFocusedElement(): void {
    if (this.document) {
      this.elementFocusedBeforeDialogWasOpened = this.document.activeElement as HTMLElement;
    }

    if (this.elementRef.nativeElement.focus) {
      Promise.resolve().then(() => this.elementRef.nativeElement.focus());
    }
  }

  onAnimationDone(event: AnimationEvent): void {
    if (event.toState.endsWith('_enter')) {
      this.trapFocus();
    } else if (event.toState.endsWith('_exit')) {
      this.restoreFocus();
    }
    this.animationStateChanged.emit(event);
  }

  onAnimationStart(event: AnimationEvent): void {
    this.animationStateChanged.emit(event);
  }

  startExitAnimation(): void {
    this.state = this.position + '_exit';
  }

  startResizing(e: MouseEvent) {
    this.resizePreviousValue = this.getMouseValue(e);

    const mouseMoveHandler = (e: MouseEvent) => {
      const currentValue = this.getMouseValue(e);
      this.resizeOffset += currentValue - this.resizePreviousValue;
      this.resizeOffset = Math.max(this.resizeOffset, 0);
      this.resizePreviousValue = currentValue;

      this.calculateStyle();
    };

    const mouseUpHandler = (e: MouseEvent) => {
      this.removeHandlers();
    };

    this.document.addEventListener('mousemove', mouseMoveHandler);
    this.document.addEventListener('mouseup', mouseUpHandler);

    this.resizeEventHandlers = {
      mouseMove: mouseMoveHandler,
      mouseUp: mouseUpHandler
    };
  }

  getMouseValue(e: MouseEvent) {
    switch (this.position) {
      case 'start':
        return e.clientX;
      case 'end':
        return -e.clientX;
      case 'top':
        return e.clientY;
      case 'bottom':
        return -e.clientY;
    }
  }

  removeHandlers() {
    if (this.resizeEventHandlers) {
      this.document.removeEventListener('mousemove', this.resizeEventHandlers.mouseMove);
      this.document.removeEventListener('mouseup', this.resizeEventHandlers.mouseUp);
      this.resizeEventHandlers = null;
    }
  }

  setPosition(position: 'start' | 'end' | 'top' | 'bottom') {
    this.position = position;
    this.resizeOffset = 0;
    this.calculateStyle();
  }

  calculateStyle() {
    if (['start', 'end'].includes(this.position)) {
      this.style = this.originalStyle + `width: calc(400px + ${this.resizeOffset}px);`;
    } else {
      this.style = this.originalStyle + `height: calc(30vh + ${this.resizeOffset}px);`;
    }
  }
}
