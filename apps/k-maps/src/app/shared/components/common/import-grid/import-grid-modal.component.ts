import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MCIT_DIALOG_DATA } from '../dialog/dialog.service';
import { McitDialogRef } from '../dialog/dialog-ref';
import { McitPopupService } from '../services/popup.service';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

const enum IMPORT_STATUS {
  UPLOADING = 'UPLOADING',
  CHECKING = 'CHECKING',
  IMPORTING = 'IMPORTING'
}

@Component({
  selector: 'mcit-import-grid-modal',
  templateUrl: './import-grid-modal.component.html',
  styleUrls: ['./import-grid-modal.component.scss'],
  providers: [TranslateModule]
})
export class McitImportGridModalComponent implements OnInit, OnDestroy {
  dataImport: {
    endpoint: any;
    checkFn: (param: any) => Observable<any>;
    importFn: (param: any) => Observable<any>;
    options: any;
  };

  status: IMPORT_STATUS;
  serviceUploadEndpoint: string;
  gridRoute: string;
  uploadFileTypes: string[] = ['csv', 'txt', '048'];

  constructor(@Inject(MCIT_DIALOG_DATA) data: any, private dialogRef: McitDialogRef<any>, private popupService: McitPopupService) {
    this.serviceUploadEndpoint = data.endpoint;
    this.dataImport = data;
    this.uploadFileTypes = this.dataImport.options.uploadFileTypes ?? this.uploadFileTypes;
    this.status = IMPORT_STATUS.UPLOADING;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  // todo: refactor this! (or change with async import)
  onUploadEnded(event: any): void {
    if (event.response.body && event.response.body.resourceId) {
      this.status = IMPORT_STATUS.CHECKING;
      this.dataImport.checkFn(event.response.body.resourceId).subscribe(
        (c) => {
          this.status = IMPORT_STATUS.IMPORTING;
          if (c) {
            this.dataImport.importFn(event.response.body.resourceId).subscribe(
              (r) => {
                this.dialogRef.close(r.body);
              },
              (error) => {
                if (error.status === 400) {
                  switch (error.error[0].error) {
                    case '"value" must be a number':
                      this.popupService.show('warning', 'IMPORT_PRICING_GRID.ERROR_400_VALUE');
                      break;
                    default:
                      this.popupService.showError('IMPORT_PRICING_GRID.ERROR_400_GRID');
                  }
                } else if (error.status === 409) {
                  this.popupService.showError('IMPORT_PRICING_GRID.ERROR_409_CONFLICT');
                } else if (error.status === 502) {
                  this.popupService.showError('IMPORT_PRICING_GRID.ERROR_502_TIMEOUT');
                } else {
                  this.popupService.showError('IMPORT_PRICING_GRID.ERROR_500_GENERIC');
                }

                this.dialogRef.close();
              }
            );
          }
        },
        (error) => {
          if (error.status === 422) {
            this.popupService.showError('IMPORT_PRICING_GRID.ERROR_422_FORMAT');
          } else if (error.status === 502) {
            this.popupService.showError('IMPORT_PRICING_GRID.ERROR_502_TIMEOUT');
          } else {
            this.popupService.showError('IMPORT_PRICING_GRID.ERROR_500_GENERIC');
          }

          this.dialogRef.close();
        }
      );
    }
  }

  onUploadError(event: any): void {
    console.log('error', event);
  }

  onUploadReset(event: any): void {
    console.log('reset', event);
  }

  goBack(): void {
    this.dialogRef.close(null);
  }
}
