import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { McitImageViewerOverlayService } from '../image-viewer-overlay/image-viewer-overlay.service';
import { McitQuestionModalService } from '../question-modal/question-modal.service';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, takeUntil, tap, toArray, shareReplay } from 'rxjs/operators';
import { McitAttachmentsHttpService } from './attachments-http.service';
import { McitPopupService } from '../services/popup.service';
import { McitDialog } from '../dialog/dialog.service';
import { McitAttachementsActionModalComponent } from './attachments-action-modal/attachments-action-modal.component';
import { editPhotoSize64 } from '../../login/helpers/edit-photo-size.helper';
import { OfflineActionStatus } from '../models/domains/offline-action-status.domain';
import { v4 as uuid } from 'uuid';
import { doCatch, logError } from '../helpers/error.helper';
import { IAction, IAttachment } from '../models/attachments.model';
import { saveAs } from 'file-saver';
import { McitAttachmentIsImagePipe } from '@lib-shared/common/attachments/pipes/attachment-is-image.pipe';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';
import { McitNativeFileSystem, mimeTypesRef } from '../file/native-file-system';

@TraceErrorClass()
@Component({
  selector: 'mcit-attachments',
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.scss'],
  animations: [
    trigger('picture-anim', [transition(':leave', [style({ opacity: 1, transform: 'scale(1,1)' }), animate('.4s ease', style({ opacity: 0, transform: 'scale(0,0)' }))])]),
    trigger('pictures-anim', [transition('* => *', [query(':enter', [style({ opacity: 0, transform: 'scale(0,0)' }), stagger(100, [animate('.4s ease', style({ opacity: 1, transform: 'scale(1,1)' }))])], { optional: true })])])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class McitAttachmentsComponent implements OnInit {
  OFFLINE_STATUS_ENUM = OfflineActionStatus;
  cordova = false;
  upload = false;

  // documentList: Array<IDocumentLink> = [];
  documentLoads: Array<boolean> = [];
  @Input() gridCols = 4;
  @Input() environment;
  @Input() editable = true;
  @Input() localMode = false;
  @Input() baseUrl;
  @Input() suffixUrl;
  @Input() titleDelete = 'ORDER-PHOTOS_COMPONENT.TITLE_DELETE_PHOTO';
  @Input() questionDelete = 'ORDER-PHOTOS_COMPONENT.QUESTION_DELETE_PHOTO';
  @Input() forceGrid4 = false;
  @Input() withEmptyPics = true;
  @Input() actions$: Observable<IAction[]> = null;
  @Input() attachments: IAttachment[] = [];
  @Input() isCompoundDamages?: boolean;
  @Input() directoryName: string;
  @Input() onlyImage = true;
  @Output() attachAdded = new EventEmitter<IAttachment>();
  @Output() attachDeleted = new EventEmitter<IAttachment>();
  @Output() attachlistChanged = new EventEmitter<IAttachment[]>();
  @Input() iconCss = 'far fa-camera-alt';
  @Input() showFileAttachmentsNames = false;
  @Input() isContainer = true;

  constructor(
    private imageViewerModalService: McitImageViewerOverlayService,
    private breakpointObserver: BreakpointObserver,
    private questionModalService: McitQuestionModalService,
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: McitDialog,
    private attachmentsHttpService: McitAttachmentsHttpService,
    private popupService: McitPopupService,
    private attachmentIsImagePipe: McitAttachmentIsImagePipe,
    private nativeFileSystem: McitNativeFileSystem
  ) {}

  get picsLength(): number {
    return this.attachments?.length || 0;
  }

  get emptyPics() {
    return new Array(this.gridCols - ((this.picsLength + 1) % this.gridCols));
  }

  set emptyPics(t) {
    this.emptyPics = new Array(this.gridCols - ((this.picsLength + 1) % this.gridCols));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateGrids();
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit() {
    this.actions$ = this.actions$?.pipe(shareReplay(1));
    this.attachments = this.attachments ?? [];
    this.documentLoads = this.attachments?.map((att) => !this.attachmentIsImagePipe.transform(att));
    this.baseUrl = this.baseUrl ? this.baseUrl : `${this.environment.apiUrl}/v2/common/private/tmp-documents/`;
    this.cordova = this.environment.cordova;
    this.updateGrids();
  }

  doOpenPhotosDialogOnCordova(): void {
    this.dialog
      .open(McitAttachementsActionModalComponent, {
        dialogClass: 'modal-sm modal-dialog-centered rounded',
        data: {
          directoryName: this.directoryName
        }
      })
      .afterClosed()
      .pipe(
        filter((attachments: IAttachment[]) => !!attachments?.length),
        mergeMap((attachments: IAttachment[]) =>
          from(attachments).pipe(
            filter((attach) => !!attach?.local_url?.length),
            mergeMap(
              (attach) =>
                this.localMode
                  ? of(attach) // en mode local, on laisse uniquement l'url locale
                  : this.nativeFileSystem.localUrlToAttach64(attach?.local_url) // en mode remote, on met la base64 pour envoyer directement la photo
            ),
            tap((attach: IAttachment) => this.emitAddChanges(attach)),
            tap(() => (this.upload = false)),
            toArray()
          )
        ),
        catchError((err) => {
          logError('ERROR_NO.41 lib attachments open photo cordova', { error: err });
          this.popupService.showError('COMMON.ERROR_NO.41');
          this.upload = false;
          return doCatch('doOpenPhotosDialogOnCordova', err, null);
        })
      )
      .subscribe();
  }

  doAddPictureOnBrowser(files: FileList): void {
    if (files.length) {
      this.upload = true;
      this.nativeFileSystem
        .getBase64(files.item(0))
        .pipe(
          filter((b64) => !!b64),
          concatMap((base64) => (['image/jpeg', 'image/png'].includes(files?.item(0)?.type) ? editPhotoSize64(base64) : of(base64))),
          tap((b64edit: string) => {
            const att64 = {
              base64: b64edit,
              name: files.item(0)?.name,
              sync_id: uuid(),
              is_loaded: true,
              meta_data: {
                created_date: new Date()
              }
            };
            this.emitAddChanges(att64);
            this.upload = false;
          }),
          catchError((err) => {
            this.upload = false;
            return doCatch('_doAddPictureOnBrowser', err, null);
          })
        )
        .subscribe();
    }
  }

  emitAddChanges(attach: IAttachment): void {
    if (attach?.local_url?.length) {
      // en mode local (uniquement sur mobile), on conserve la photo dans les dossiers cache de l'application
      this.attachAdded.emit(attach);
      this.attachments.push(attach);
      this.attachlistChanged.emit(this.attachments);
    } else if (attach?.base64?.length) {
      // en mode distant, on envoie la photo dans S3 à partir de la base64 de la photo
      this.attachmentsHttpService
        .addTmpDocument(this.nativeFileSystem.convertToFormData(this.nativeFileSystem.b64ToFile(attach?.base64), attach?.name), this.baseUrl, this.suffixUrl)
        .pipe(
          map(
            (docId) =>
              ({
                document_id: docId?.toString(),
                name: attach?.name,
                sync_id: attach?.sync_id,
                remote_url: (this.baseUrl ?? `${this.environment.apiUrl}/v2/common/private/tmp-documents/`) + docId + (this.suffixUrl ?? ''),
                is_loaded: true,
                base64: this.environment.cordova ? undefined : attach?.base64,
                meta_data: {
                  created_date: new Date()
                },
              } as IAttachment)
          ),
          tap((attachRemote) => {
            this.attachAdded.emit(attachRemote);
            this.attachments.push(attachRemote);
            this.attachlistChanged.emit(this.attachments);

            if (!this.attachmentIsImagePipe.transform(attachRemote)) {
              this.onDocumentLoad(this.attachments.length - 1);
            }
          }),
          catchError((err) => doCatch('emitAddChanges.remote', err, null))
        )
        .subscribe();
    } else {
      console.error('Only RemoteMode with b64 is supported (and LocalMode with File_Uri for mobile only)');
    }
  }

  doDeletePicture(current: IAttachment): void {
    this.questionModalService
      .showQuestion(this.titleDelete, this.questionDelete, 'COMMON.ERASE', 'COMMON.CANCEL', true)
      .pipe(filter((isYesAnswer: boolean) => isYesAnswer === true))
      .subscribe(() => {
        this.attachDeleted.emit(current);
        this.attachments = this.attachments.filter((att) => (att?.sync_id?.length ? att?.sync_id !== current?.sync_id : att?.document_id !== current?.document_id));
        this.attachlistChanged.emit(this.attachments);
      });
  }

  doShowPicture(index: number): void {
    this.imageViewerModalService.open({
      urls: this.attachments,
      current: index,
      ...(this.isCompoundDamages ? {customFilenames: this.attachments.map((att) => att?.name)} : {}),
    });
  }

  onDocumentLoad(index: number): void {
    this.documentLoads[index] = true;
    this.changeDetectorRef.detectChanges();
  }

  trackByFn(index: number, item: IAttachment): string {
    if (item?.remote_url?.length) {
      return item?.remote_url;
    } else if (item?.local_url?.length) {
      return item?.local_url;
    }
  }

  private updateGrids(): void {
    if (this.forceGrid4) {
      this.gridCols = 4;
    } else {
      if (this.breakpointObserver.isMatched('(max-width: 767px)')) {
        this.gridCols = this.gridCols || 4;
      } else {
        this.gridCols = this.gridCols || 10;
      }
    }
  }

  public doDownloadFile(attach: IAttachment): void {
    this.questionModalService
      .showQuestion('ATTACHMENTS_COMPONENT.TITLE_DOWNLOAD_FILE', 'ATTACHMENTS_COMPONENT.QUESTION_DOWNLOAD_FILE', 'COMMON.VALIDATE', 'COMMON.CANCEL', false, {
        questionParams: {
          filename: attach?.name
        }
      })
      .pipe(
        concatMap((res) => (res ? this.attachmentsHttpService.getTmpDocument(attach?.document_id, false) : of(null))),
        filter((res) => !!res),
        tap((data: { buff: ArrayBuffer; url: string }) => {
          saveAs(new Blob([data.buff], { type: attach?.type }), attach?.name);
        }),
        catchError((err) => {
          logError('ERROR_NO.42 lib attachments open photo cordova', { error: err });
          this.popupService.showError('COMMON.ERROR_NO.42');
          return doCatch('lib attachments do DownloadFile', err, null);
        })
      )
      .subscribe();
  }
}
