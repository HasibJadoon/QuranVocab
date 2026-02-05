import { ComponentRef, ElementRef, Inject, Injectable, InjectionToken, Injector, Optional, TemplateRef } from '@angular/core';
import { ComponentType, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { McitGlobalDialog } from '../dialog/global-dialog.service';
import * as lodash from 'lodash';
import { McitAnimationTypeDropdown, McitDropdownConfig } from './dropdown-config';
import { ComponentPortal, PortalInjector, TemplatePortal } from '@angular/cdk/portal';
import { McitDropdownRef } from './dropdown-ref';
import { McitDropdownContainerComponent } from './dropdown-container.component';

export const MCIT_DROPDOWN_DATA = new InjectionToken<any>('MCIT_DROPDOWN_DATA');

export const MCIT_DROPDOWN_DEFAULT_OPTIONS = new InjectionToken<McitDropdownConfig>('MCIT_DROPDOWN_DEFAULT_OPTIONS');

export interface Shape {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

@Injectable()
export class McitDropdown {
  private defaultConfig: McitDropdownConfig;

  constructor(private injector: Injector, private overlay: Overlay, private modalService: McitGlobalDialog, @Optional() @Inject(MCIT_DROPDOWN_DEFAULT_OPTIONS) defaultConfig: McitDropdownConfig) {
    this.defaultConfig = lodash.defaultsDeep({}, defaultConfig || {}, {
      disableClose: false,
      hasBackdrop: true,
      autoFocus: false,
      restoreFocus: true,
      backdropClass: 'mcit-dropdown-backdrop',
      role: 'dropdown',
      positions: [
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top'
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom'
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top'
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom'
        }
      ],
      animationType: McitAnimationTypeDropdown.UP_TO_DOWN,
      flexibleDimensions: false,
      lockedPosition: true,
      viewportMargin: null,
      size: null
    });
  }

  open<T, D = any, R = any>(componentTypeOrTemplateRef: ComponentType<T> | TemplateRef<T>, elementRef: ElementRef | HTMLElement | Shape, config?: McitDropdownConfig<D>): McitDropdownRef<T, R> {
    config = lodash.defaultsDeep(config, this.defaultConfig);

    const positionStrategy = this.overlay.position().flexibleConnectedTo(elementRef).withFlexibleDimensions(config.flexibleDimensions).withViewportMargin(config.viewportMargin).withPositions(config.positions);

    if (config.lockedPosition) {
      positionStrategy.withLockedPosition();
    }

    const oc = lodash.merge(
      {
        hasBackdrop: config.hasBackdrop,
        scrollStrategy: this.overlay.scrollStrategies.close(),
        panelClass: config.panelClass,
        backdropClass: config.backdropClass,
        positionStrategy
      },
      config.size
    );

    const overlayRef = this.overlay.create(oc);

    const container = this.attachDropdownContainer<D>(overlayRef, config);

    const dropdownRef = new McitDropdownRef<T, R>(overlayRef, container, config);

    const callback = () => {
      dropdownRef.close();
    };
    this.modalService.registerOtherModal(callback);
    const s = overlayRef.detachments().subscribe(() => {
      s.unsubscribe();

      this.modalService.unregisterOtherModal(callback);
    });

    dropdownRef.componentInstance = this.attachDialogContent<T, D, R>(componentTypeOrTemplateRef, container, config, dropdownRef);

    overlayRef.backdropClick().subscribe((_) => dropdownRef.close());

    return dropdownRef;
  }

  private attachDropdownContainer<D>(overlayRef: OverlayRef, config: McitDropdownConfig<D>): McitDropdownContainerComponent {
    const injectionTokens = new WeakMap();
    injectionTokens.set(OverlayRef, overlayRef);
    injectionTokens.set(McitDropdownConfig, config);

    const injector = new PortalInjector(this.injector, injectionTokens);

    const containerPortal = new ComponentPortal(McitDropdownContainerComponent, config.viewContainerRef, injector);
    const containerRef: ComponentRef<McitDropdownContainerComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private attachDialogContent<T, D, R>(componentTypeOrTemplateRef: ComponentType<T> | TemplateRef<T>, container: McitDropdownContainerComponent, config: McitDropdownConfig<D>, dropdownRef: McitDropdownRef<T, R>): T {
    let containerRef;
    if (componentTypeOrTemplateRef instanceof TemplateRef) {
      containerRef = container.attach(new TemplatePortal<T>(componentTypeOrTemplateRef, null, <any>{ $implicit: config.data, dropdownRef }));
    } else {
      const injector = this.createInjector(config, dropdownRef);
      const containerPortal = new ComponentPortal<T>(componentTypeOrTemplateRef, undefined, injector);
      containerRef = container.attach(containerPortal);
    }

    return containerRef.instance;
  }

  private createInjector<T>(config: McitDropdownConfig, dropdownRef: McitDropdownRef<T>): Injector {
    return Injector.create({
      providers: [
        { provide: McitDropdownRef, useValue: dropdownRef },
        { provide: MCIT_DROPDOWN_DATA, useValue: config.data }
      ],
      parent: this.injector
    });
  }
}
