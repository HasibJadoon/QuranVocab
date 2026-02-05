import { AfterViewInit, Component, ComponentRef, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Inject, OnDestroy, OnInit, Optional, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { Observable, Subject } from 'rxjs';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { OverlayRef } from '@angular/cdk/overlay';
import { McitAnimationTypeDropdown, McitDropdownConfig } from './dropdown-config';

@Component({
  selector: 'mcit-dropdown-overlay-container',
  templateUrl: './dropdown-container.component.html',
  styleUrls: ['./dropdown-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('dropdownContainer', [
      state('void', style({ opacity: 0 })),
      // None
      state('none_void, none_exit', style({ opacity: 0, transform: 'scale(0)', 'transform-origin': 'center center' })),
      state('none_enter', style({ transform: 'none', 'transform-origin': 'center center' })),
      // UP TO DOWN
      state('utd_void, utd_exit', style({ opacity: 0, transform: 'scaleY(0)', 'transform-origin': 'top left' })),
      state('utd_enter', style({ transform: 'none', 'transform-origin': 'top left' })),
      transition('utd_void => utd_enter', [animate('0.1s ease', style({ transform: 'none', 'transform-origin': 'top left', opacity: 1 }))]),
      transition('utd_enter => utd_exit', [animate('0.1s ease', style({ opacity: 0, transform: 'scaleY(0)', 'transform-origin': 'top left' }))]),
      // Circular
      state('cir_void, cir_exit', style({ opacity: 0, transform: 'scale(0)', 'transform-origin': 'center center' })),
      state('cir_enter', style({ transform: 'none', 'transform-origin': 'center center' })),
      transition('cir_void => cir_enter', [animate('0.1s ease', style({ transform: 'none', 'transform-origin': 'center center', opacity: 1 }))]),
      transition('cir_enter => cir_exit', [animate('0.1s ease', style({ opacity: 0, transform: 'scale(0)', 'transform-origin': 'center center' }))]),
      // LEFT TO RIGHT
      state('ltr_void, ltr_exit', style({ opacity: 0, transform: 'scaleX(0)', 'transform-origin': 'top left' })),
      state('ltr_enter', style({ transform: 'none', 'transform-origin': 'top left' })),
      transition('ltr_void => ltr_enter', [animate('0.1s ease', style({ transform: 'none', 'transform-origin': 'top left', opacity: 1 }))]),
      transition('ltr_enter => ltr_exit', [animate('0.1s ease', style({ opacity: 0, transform: 'scaleX(0)', 'transform-origin': 'top left' }))])
    ])
  ],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'dropdown',
    style: 'display:block',
    tabindex: '-1',
    'aria-modal': 'true',
    '[attr.role]': 'config.role',
    '[attr.aria-labelledby]': 'config.ariaLabel',
    '[attr.aria-label]': 'config.ariaLabel',
    '[attr.aria-describedby]': 'config.ariaDescribedBy'
  }
})
export class McitDropdownContainerComponent extends BasePortalOutlet implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CdkPortalOutlet, { static: true })
  _portalOutlet: CdkPortalOutlet;

  dropdownClass: string;
  state: string;

  readonly animationStateChanged = new EventEmitter<AnimationEvent>();

  private animationType: McitAnimationTypeDropdown;
  private readonly backdropEventsSubject = new Subject<void>();
  private readonly escEventsSubject = new Subject<void>();
  private focusTrap: FocusTrap;
  private elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

  constructor(
    private elementRef: ElementRef,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private renderer: Renderer2,
    @Optional() @Inject(DOCUMENT) private document: any,
    private overlayRef: OverlayRef,
    private config: McitDropdownConfig
  ) {
    super();
  }

  ngOnInit(): void {
    this.animationType = this.config.animationType;
    this.dropdownClass = this.config.dropdownClass;

    this.state = this.animationType + '_void';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.state = this.animationType + '_enter';
    }, 0);
  }

  ngOnDestroy(): void {}

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
    if (!this.focusTrap) {
      this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
    }
    if (this.config.autoFocus) {
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

    if (this.config.restoreFocus && this.elementRef.nativeElement.focus) {
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
    this.state = this.animationType + '_exit';
  }
}
