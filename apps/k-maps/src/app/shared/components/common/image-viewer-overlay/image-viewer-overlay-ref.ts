import { OverlayRef } from '@angular/cdk/overlay';

export class McitImageViewerOverlayRef {
  constructor(private overlayRef: OverlayRef) {}

  close(): void {
    this.overlayRef.dispose();
  }
}
