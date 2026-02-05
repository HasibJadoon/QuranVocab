import { Component, Inject, OnInit } from '@angular/core';
import { Camera, CameraOptions, DestinationType } from '@awesome-cordova-plugins/camera/ngx';
import { McitDialogRef } from '../../dialog/dialog-ref';
import { combineLatest, from, of } from 'rxjs';
import { catchError, concatMap, map, tap, filter, defaultIfEmpty } from 'rxjs/operators';
import { doCatch, logError } from '../../helpers/error.helper';
import { MCIT_DIALOG_DATA } from '../../dialog/dialog.service';
import { v4 as uuid } from 'uuid';
import { compact } from 'lodash';
import { IAttachment } from '../../models/attachments.model';
import { Entry } from '@awesome-cordova-plugins/file/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitNativeFileSystem } from '@lib-shared/common/file/native-file-system';
import { DEFAULT_CAMERA_OPTIONS } from '@lib-shared/login/helpers/edit-photo-size.helper';

declare let cordova;

export interface IDocumentScanResult {
  pdfUrl: string; //  a PDF file of the scanned pages (example: "file://.pdf")
  scans: {
    originalUrl: string; // The original file as scanned from the camera. "file://.jpeg"
    enhancedUrl: string; // The cropped and enhanced file, as processed by the SDK. "file://.{jpeg|png}"
  }[];
}

@TraceErrorClass()
@Component({
  selector: 'mcit-attachments-action-modal',
  templateUrl: './attachments-action-modal.component.html',
  styleUrls: ['./attachments-action-modal.component.scss']
})
export class McitAttachementsActionModalComponent implements OnInit {
  private withScanPdf: boolean;
  private directoryName: string;

  constructor(
    private camera: Camera,
    private device: Device,
    private nativeFileSystem: McitNativeFileSystem,
    private dialogRef: McitDialogRef<McitAttachementsActionModalComponent, IAttachment[]>,
    @Inject(MCIT_DIALOG_DATA) data: { withScanPdf?: boolean; directoryName?: string },
    private popupService: McitPopupService
  ) {
    this.withScanPdf = data?.withScanPdf;
    this.directoryName = data?.directoryName;
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }

  doPicture(isFromCamera: boolean = true): void {
    const options: CameraOptions = {
      ...DEFAULT_CAMERA_OPTIONS,
      sourceType: isFromCamera ? 1 : 0, // Default is CAMERA. PHOTOLIBRARY : 0, CAMERA : 1, SAVEDPHOTOALBUM : 2
      destinationType: DestinationType.FILE_URL
    };

    from(this.camera.getPicture(options))
      .pipe(
        filter((uri) => !!uri),
        map((uri: string) => (isFromCamera || this.device?.platform?.toLowerCase() === 'ios' ? uri : uri?.split('?').slice(0, -1).join('?'))),
        concatMap((uri: string) => this.nativeFileSystem.moveFileToDataDirectory(uri, this.directoryName)),
        filter((newFile) => !!newFile),
        tap((newFile) =>
          this.dialogRef.close([
            {
              local_url: newFile.toInternalURL(),
              type: this.nativeFileSystem.findMimeType(newFile.name),
              name: newFile.name,
              sync_id: uuid(),
              is_loaded: true
            }
          ])
        ),
        catchError((error) => {
          if (error !== 'No Image Selected') {
            logError(`Error when getting ${isFromCamera ? 'camera' : 'gallery'} :`, { error });
          }
          this.dialogRef.close();
          return of(null);
        }),
        defaultIfEmpty(null)
      )
      .subscribe();
  }

  doScanDocumentPhotoAndPdf(): void {
    const options = {
      multiPage: false,
      defaultFilter: 'blackAndWhite',
      pdfPageSize: 'a4'
    };
    from(this.scanWithConfigurationToPromise(options))
      .pipe(
        concatMap((scanResult: IDocumentScanResult) =>
          combineLatest([
            this.nativeFileSystem.moveFileToDataDirectory(scanResult?.scans?.[0]?.enhancedUrl, this.directoryName),
            this.withScanPdf ? this.nativeFileSystem.moveFileToDataDirectory(scanResult?.pdfUrl, this.directoryName, this.withScanPdf) : of(null)
          ])
        ),
        tap((res) => console.log('res forkjoin', res)),
        tap((newFiles: Entry[]) => {
          let pdf: IAttachment;
          const pict: IAttachment = {
            local_url: newFiles?.[0]?.toInternalURL(),
            type: this.nativeFileSystem.findMimeType(newFiles?.[0]?.name),
            name: newFiles?.[0]?.name,
            sync_id: uuid(),
            is_loaded: true
          };
          if (this.withScanPdf) {
            pdf = {
              local_url: newFiles?.[1]?.toInternalURL(),
              type: this.nativeFileSystem.findMimeType(newFiles?.[1]?.name),
              name: newFiles?.[1]?.name,
              sync_id: uuid(),
              is_loaded: true
            };
          }
          this.dialogRef.close(compact([pict, pdf]));
        }),
        catchError((err) => {
          this.dialogRef.close();
          this.popupService.showError(`COMMON.ERROR_NO.45`);
          return doCatch('ERROR_NO.45 _doScanDocumentPhotoAndPdf', err, null);
        })
      )
      .subscribe();
  }

  scanWithConfigurationToPromise(options: any): Promise<IDocumentScanResult> {
    return new Promise<IDocumentScanResult>((resolve, reject) =>
      cordova.plugins.GeniusScan.scanWithConfiguration(
        options,
        (result) => resolve(result),
        (error) => reject(error)
      )
    );
  }
}
