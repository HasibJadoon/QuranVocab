import { ComponentRef, Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { McitImageViewerOverlayContainerComponent } from './image-viewer-overlay-container.component';
import { McitImageViewerOverlayConfig } from './image-viewer-overlay-config';
import { McitGlobalDialog } from '../dialog/global-dialog.service';
import { McitImageViewerOverlayRef } from './image-viewer-overlay-ref';
import { IMAGE_VIEWER_DIALOG_DATA } from './image-viewer.data';

@Injectable()
export class McitImageViewerOverlayService {
  constructor(private injector: Injector, private overlay: Overlay, private modalService: McitGlobalDialog) {}

  open(config: McitImageViewerOverlayConfig): McitImageViewerOverlayRef {
    const positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();

    const overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    });
    const dialogRef = new McitImageViewerOverlayRef(overlayRef);

    const callback = () => {
      dialogRef.close();
    };
    this.modalService.registerOtherModal(callback);
    const s = overlayRef.detachments().subscribe(() => {
      s.unsubscribe();

      this.modalService.unregisterOtherModal(callback);
    });

    const overlayComponent = this.attachDialogContainer(overlayRef, config, dialogRef);

    overlayRef.backdropClick().subscribe((_) => dialogRef.close());

    return dialogRef;
  }

  private attachDialogContainer(overlayRef: OverlayRef, image: McitImageViewerOverlayConfig, dialogRef: McitImageViewerOverlayRef) {
    const injector = this.createInjector(image, dialogRef);

    const containerPortal = new ComponentPortal(McitImageViewerOverlayContainerComponent, null, injector);
    const containerRef: ComponentRef<McitImageViewerOverlayContainerComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private createInjector(image: McitImageViewerOverlayConfig, dialogRef: McitImageViewerOverlayRef): Injector {
    return Injector.create({
      providers: [
        { provide: McitImageViewerOverlayRef, useValue: dialogRef },
        { provide: IMAGE_VIEWER_DIALOG_DATA, useValue: image }
      ],
      parent: this.injector
    });
  }
}
