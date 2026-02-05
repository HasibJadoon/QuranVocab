import { ComponentRef, Inject, Injectable, InjectionToken, Injector, Optional, TemplateRef } from '@angular/core';
import { ComponentType, Overlay, OverlayRef } from '@angular/cdk/overlay';
import * as lodash from 'lodash';
import { McitOffcanvasConfig } from './offcanvas-config';
import { ComponentPortal, PortalInjector, TemplatePortal } from '@angular/cdk/portal';
import { McitOffcanvasRef } from './offcanvas-ref';
import { McitGlobalDialog } from '../dialog/global-dialog.service';
import { McitOffcanvasContainerComponent } from './offcanvas-container.component';

export const MCIT_OFFCANVAS_DATA = new InjectionToken<any>('MCIT_OFFCANVAS_DATA');

export const MCIT_OFFCANVAS_DEFAULT_OPTIONS = new InjectionToken<McitOffcanvasConfig>('MCIT_OFFCANVAS_DEFAULT_OPTIONS');

@Injectable()
export class McitOffcanvas {
  private defaultConfig: McitOffcanvasConfig;

  constructor(private injector: Injector, private overlay: Overlay, private modalService: McitGlobalDialog, @Optional() @Inject(MCIT_OFFCANVAS_DEFAULT_OPTIONS) defaultConfig: McitOffcanvasConfig) {
    this.defaultConfig = lodash.defaultsDeep({}, defaultConfig || {}, {
      disableClose: false,
      hasBackdrop: true,
      autoFocus: true,
      restoreFocus: true,
      role: 'offcanvas',
      position: 'start',
      enableBodyScroll: false
    });
  }

  open<T, D = any, R = any>(componentTypeOrTemplateRef: ComponentType<T> | TemplateRef<T>, config?: McitOffcanvasConfig<D>): McitOffcanvasRef<T, R> {
    config = lodash.defaultsDeep(config, this.defaultConfig);

    const positionStrategy = this.overlay.position().global().top('0').bottom('0').right('0').left('0');

    const overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      panelClass: config.panelClass,
      positionStrategy
    });

    const container = this.attachOffcanvasContainer<D>(overlayRef, config);

    const offcanvasRef = new McitOffcanvasRef<T, R>(overlayRef, container, config);

    const callback = () => {
      offcanvasRef.close();
    };
    this.modalService.registerOtherModal(callback);
    const s = overlayRef.detachments().subscribe(() => {
      s.unsubscribe();

      this.modalService.unregisterOtherModal(callback);
    });

    offcanvasRef.componentInstance = this.attachOffcanvasContent<T, D, R>(componentTypeOrTemplateRef, container, config, offcanvasRef);

    overlayRef.backdropClick().subscribe((_) => offcanvasRef.close());

    return offcanvasRef;
  }

  private attachOffcanvasContainer<D>(overlayRef: OverlayRef, config: McitOffcanvasConfig<D>): McitOffcanvasContainerComponent {
    const injectionTokens = new WeakMap();
    injectionTokens.set(OverlayRef, overlayRef);
    injectionTokens.set(McitOffcanvasConfig, config);

    const injector = new PortalInjector(this.injector, injectionTokens);

    const containerPortal = new ComponentPortal(McitOffcanvasContainerComponent, config.viewContainerRef, injector);
    const containerRef: ComponentRef<McitOffcanvasContainerComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private attachOffcanvasContent<T, D, R>(componentTypeOrTemplateRef: ComponentType<T> | TemplateRef<T>, container: McitOffcanvasContainerComponent, config: McitOffcanvasConfig<D>, offcanvasRef: McitOffcanvasRef<T, R>): T {
    let containerRef;
    if (componentTypeOrTemplateRef instanceof TemplateRef) {
      containerRef = container.attach(new TemplatePortal<T>(componentTypeOrTemplateRef, null, <any>{ $implicit: config.data, offcanvasRef }));
    } else {
      const injector = this.createInjector(config, offcanvasRef);
      const containerPortal = new ComponentPortal<T>(componentTypeOrTemplateRef, undefined, injector);
      containerRef = container.attach(containerPortal);
    }

    return containerRef.instance;
  }

  private createInjector<T>(config: McitOffcanvasConfig, offcanvasRef: McitOffcanvasRef<T>): Injector {
    return Injector.create({
      providers: [
        { provide: McitOffcanvasRef, useValue: offcanvasRef },
        { provide: MCIT_OFFCANVAS_DATA, useValue: config.data }
      ],
      parent: this.injector
    });
  }
}
