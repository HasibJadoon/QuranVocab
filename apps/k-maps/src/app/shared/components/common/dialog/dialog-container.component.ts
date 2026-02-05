import { Component, ComponentRef, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Inject, OnDestroy, OnInit, Optional, ViewChild, ViewEncapsulation } from '@angular/core';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { McitGlobalDialog } from './global-dialog.service';
import { OverlayRef } from '@angular/cdk/overlay';
import { McitDialogConfig } from './dialog-config';
import { Observable, Subject } from 'rxjs';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'mcit-modal-overlay-container',
  templateUrl: './dialog-container.component.html',
  styleUrls: ['./dialog-container.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('dialogContainer', [
      state('void, exit', style({ opacity: 0, transform: 'translateY(-50vh)' })),
      state('enter', style({ transform: 'none' })),
      transition('* => enter', [animate('0.3s ease', style({ transform: 'none', opacity: 1 }))]),
      transition('* => void, * => exit', [animate('0.3s ease', style({ opacity: 0, transform: 'translateY(-50vh)' }))])
    ]),
    trigger('dialogBackdrop', [
      state('void, exit', style({ opacity: 0 })),
      state('enter', style({ transform: 'none' })),
      transition('* => enter', [animate('0.3s ease', style({ opacity: 1 }))]),
      transition('* => void, * => exit', [animate('0.3s ease', style({ opacity: 0 }))])
    ])
  ],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'modal',
    style: 'display:block',
    tabindex: '-1',
    'aria-modal': 'true',
    '[attr.role]': 'config.role',
    '[attr.aria-labelledby]': 'config.ariaLabel',
    '[attr.aria-label]': 'config.ariaLabel',
    '[attr.aria-describedby]': 'config.ariaDescribedBy'
  }
})
export class McitDialogContainerComponent extends BasePortalOutlet implements OnInit, OnDestroy {
  @ViewChild(CdkPortalOutlet, { static: true }) _portalOutlet: CdkPortalOutlet;

  dialogClass: string;
  hasBackdrop: boolean;
  showBackdrop: boolean;
  backdropClass: string;
  state: 'void' | 'enter' | 'exit' = 'enter';
  disableDrag: boolean;

  readonly animationStateChanged = new EventEmitter<AnimationEvent>();

  private readonly backdropEventsSubject = new Subject<void>();
  private readonly escEventsSubject = new Subject<void>();
  private focusTrap: FocusTrap;
  private elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

  constructor(
    private elementRef: ElementRef,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private globalDialog: McitGlobalDialog,
    @Optional() @Inject(DOCUMENT) private document: any,
    private overlayRef: OverlayRef,
    private config: McitDialogConfig
  ) {
    super();
  }

  ngOnInit(): void {
    this.dialogClass = this.config.dialogClass;
    this.hasBackdrop = this.config.hasBackdrop;
    this.showBackdrop = true;
    this.backdropClass = this.config.backdropClass || 'mcit-dialog-backdrop';
    this.disableDrag = this.config.disableDrag;

    this.globalDialog.setScrollbar();

    this.overlayRef.detachments().subscribe(() => {
      this.globalDialog.resetScrollbar();
    });
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

    if (this.elementRef.nativeElement.focus) {
      Promise.resolve().then(() => this.elementRef.nativeElement.focus());
    }
  }

  onAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'enter') {
      this.trapFocus();
    } else if (event.toState === 'exit') {
      this.restoreFocus();
    }

    this.animationStateChanged.emit(event);
  }

  onAnimationStart(event: AnimationEvent): void {
    this.animationStateChanged.emit(event);
  }

  startExitAnimation(): void {
    this.state = 'exit';
  }
}
