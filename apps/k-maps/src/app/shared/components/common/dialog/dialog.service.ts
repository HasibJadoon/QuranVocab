import { ComponentRef, Inject, Injectable, InjectionToken, Injector, Optional, TemplateRef } from '@angular/core';
import { ComponentType, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector, TemplatePortal } from '@angular/cdk/portal';
import { McitGlobalDialog } from './global-dialog.service';
import { McitDialogRef } from './dialog-ref';
import { McitDialogContainerComponent } from './dialog-container.component';
import { McitDialogConfig } from './dialog-config';
import * as lodash from 'lodash';

export const MCIT_DIALOG_DATA = new InjectionToken<any>('MCIT_DIALOG_DATA');

export const MCIT_DIALOG_DEFAULT_OPTIONS = new InjectionToken<McitDialogConfig>('MCIT_DIALOG_DEFAULT_OPTIONS');

@Injectable()
export class McitDialog {
  private defaultConfig: McitDialogConfig;

  constructor(private injector: Injector, private overlay: Overlay, private modalService: McitGlobalDialog, @Optional() @Inject(MCIT_DIALOG_DEFAULT_OPTIONS) defaultConfig: McitDialogConfig) {
    this.defaultConfig = lodash.defaultsDeep({}, defaultConfig || {}, {
      disableClose: true,
      hasBackdrop: true,
      autoFocus: true,
      restoreFocus: true,
      role: 'dialog'
    });
  }

  open<T, D = any, R = any>(componentTypeOrTemplateRef: ComponentType<T> | TemplateRef<T>, config?: McitDialogConfig<D>): McitDialogRef<T, R> {
    config = lodash.defaultsDeep(config, this.defaultConfig);

    const positionStrategy = this.overlay.position().global().top('0').bottom('0').right('0').left('0');

    const overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      panelClass: config.panelClass,
      positionStrategy
    });

    const container = this.attachDialogContainer<D>(overlayRef, config);

    const dialogRef = new McitDialogRef<T, R>(overlayRef, container, config);

    const callback = () => {
      dialogRef.close();
    };
    this.modalService.registerOtherModal(callback);
    const s = overlayRef.detachments().subscribe(() => {
      s.unsubscribe();

      this.modalService.unregisterOtherModal(callback);
    });

    dialogRef.componentInstance = this.attachDialogContent<T, D, R>(componentTypeOrTemplateRef, container, config, dialogRef);

    overlayRef.backdropClick().subscribe((_) => dialogRef.close());

    return dialogRef;
  }

  private attachDialogContainer<D>(overlayRef: OverlayRef, config: McitDialogConfig<D>): McitDialogContainerComponent {
    const injectionTokens = new WeakMap();
    injectionTokens.set(OverlayRef, overlayRef);
    injectionTokens.set(McitDialogConfig, config);

    const injector = new PortalInjector(this.injector, injectionTokens);

    const containerPortal = new ComponentPortal(McitDialogContainerComponent, config.viewContainerRef, injector);
    const containerRef: ComponentRef<McitDialogContainerComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private attachDialogContent<T, D, R>(componentTypeOrTemplateRef: ComponentType<T> | TemplateRef<T>, container: McitDialogContainerComponent, config: McitDialogConfig<D>, dialogRef: McitDialogRef<T, R>): T {
    let containerRef;
    if (componentTypeOrTemplateRef instanceof TemplateRef) {
      containerRef = container.attach(new TemplatePortal<T>(componentTypeOrTemplateRef, null, <any>{ $implicit: config.data, dialogRef }));
    } else {
      const injector = this.createInjector(config, dialogRef);
      const containerPortal = new ComponentPortal<T>(componentTypeOrTemplateRef, undefined, injector);
      containerRef = container.attach(containerPortal);
    }

    return containerRef.instance;
  }

  private createInjector<T>(config: McitDialogConfig, dialogRef: McitDialogRef<T>): Injector {
    return Injector.create({
      providers: [
        { provide: McitDialogRef, useValue: dialogRef },
        { provide: MCIT_DIALOG_DATA, useValue: config.data }
      ],
      parent: this.injector
    });
  }
}
