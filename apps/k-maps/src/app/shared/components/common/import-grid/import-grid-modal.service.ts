import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { McitDialog } from '../dialog/dialog.service';
import { McitImportGridModalComponent } from './import-grid-modal.component';

@Injectable()
export class McitImportGridModalService {
  constructor(private dialog: McitDialog) {}

  importGrid(
    endpoint: string,
    checkFn: (resourceId: any) => Observable<HttpResponse<any>>,
    importFn: (resourceId: any) => Observable<HttpResponse<any>>,
    options: {
      titleKey: string;
      descriptionKey: string;
      uploadFileTypes?: string[];
    }
  ): Observable<any> {
    const ref = this.dialog.open(McitImportGridModalComponent, {
      dialogClass: 'modal-lg modal-dialog-centered',
      data: {
        endpoint,
        checkFn,
        importFn,
        options
      }
    });
    return ref.afterClosed();
  }
}
