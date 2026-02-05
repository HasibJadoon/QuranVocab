import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ESCAPE, LEFT_ARROW, RIGHT_ARROW } from '@angular/cdk/keycodes';
import { animate, style, transition, trigger } from '@angular/animations';
import { McitPinchZoomComponent } from './widgets/pinch-zoom/pinch-zoom.component';
import { McitImageViewerOverlayConfig } from './image-viewer-overlay-config';
import { McitImageViewerOverlayRef } from './image-viewer-overlay-ref';
import { IMAGE_VIEWER_DIALOG_DATA } from './image-viewer.data';
import * as FileSaver from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { McitPopupService } from '../services/popup.service';
import { McitCoreEnv } from '../helpers/provider.helper';
import { forkJoin, of, ReplaySubject, Observable } from 'rxjs';
import { McitAttachmentToBase64Pipe } from '../common/pipes/attachments-to-base64.pipe';
import { catchError, tap, map, shareReplay } from 'rxjs/operators';
import { doCatch } from '../helpers/error.helper';
import { IAttachment } from '../models/attachments.model';

const FILENAME_REGEXP = new RegExp('filename[^;=\\n]*=(([\'"]).*?\\2|[^;\\n]*)');

@Component({
  selector: 'mcit-image-viewer-overlay',
  templateUrl: './image-viewer-overlay-container.component.html',
  styleUrls: ['./image-viewer-overlay-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('show-anim', [transition(':enter', [style({ opacity: 0 }), animate('.4s ease', style({ opacity: 1 }))])]),
    trigger('image-anim', [transition('false => true', [style({ opacity: 0 }), animate('.4s ease', style({ opacity: 1 }))])]),
    trigger('move-image-anim', [
      transition('static => left', [style({ opacity: 1, transform: 'translateX(0)' }), animate('.4s ease', style({ opacity: 0, transform: 'translateX(-50vw)' }))]),
      transition('static => right', [style({ opacity: 1, transform: 'translateX(0)' }), animate('.4s ease', style({ opacity: 0, transform: 'translateX(50vw)' }))]),
      transition('left => static', [style({ opacity: 0, transform: 'translateX(50vw)' }), animate('.4s ease', style({ opacity: 1, transform: 'translateX(0)' }))]),
      transition('right => static', [style({ opacity: 0, transform: 'translateX(-50vw)' }), animate('.4s ease', style({ opacity: 1, transform: 'translateX(0)' }))])
    ])
  ]
})
export class McitImageViewerOverlayContainerComponent implements OnInit {
  @ViewChild('pinchzoom', { static: false })
  pinchzoom: McitPinchZoomComponent;
  @ViewChildren('img')
  imgs: QueryList<ElementRef>;

  urls: string[];
  current: number;
  loaded: boolean[];

  stats: 'static' | 'left' | 'right' = 'static';

  cordova: boolean;

  init$: Observable<boolean>;

  private nextCurrent: number;

  constructor(
    private dialogRef: McitImageViewerOverlayRef,
    @Inject(IMAGE_VIEWER_DIALOG_DATA) private image: McitImageViewerOverlayConfig,
    private changeDetectorRef: ChangeDetectorRef,
    private httpClient: HttpClient,
    private popupService: McitPopupService,
    private env: McitCoreEnv,
    private attachToBase64: McitAttachmentToBase64Pipe
  ) {
    this.cordova = env.cordova;
  }

  ngOnInit(): void {
    this.init$ = forkJoin(this.image.urls.map((url: string | IAttachment) => (typeof url === 'string' ? of(url) : this.attachToBase64.transform(url)).pipe(catchError((err) => doCatch('doShowPicture', err, url))))).pipe(
      map((urls) => {
        this.urls = urls;
        this.loaded = new Array(this.urls.length).fill(false);
        this.current = this.nextCurrent = this.image.current;
        return true;
      }),
      shareReplay(1)
    );
  }

  @HostListener('document:keydown', ['$event'])
  private handleKeydown(event: KeyboardEvent) {
    if (event.keyCode === ESCAPE || event.key === 'Escape') {
      this.dialogRef.close();
    } else if (event.keyCode === LEFT_ARROW || event.key === 'ArrowLeft') {
      this.doMoveToLeft();
    } else if (event.keyCode === RIGHT_ARROW || event.key === 'ArrowRight') {
      this.doMoveToRight();
    }
  }

  onLoad(index: number): void {
    this.loaded[index] = true;
    this.changeDetectorRef.detectChanges();
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doMoveToLeft(swipe: boolean = false): void {
    if (this.stats !== 'static' || (swipe && this.pinchzoom.scale > 1)) {
      return;
    }
    this.stats = 'right';
    if (this.current === 0) {
      this.nextCurrent = this.urls.length - 1;
    } else {
      this.nextCurrent = this.current - 1;
    }
    this.pinchzoom.reset();
    this.changeDetectorRef.detectChanges();
  }

  doMoveToRight(swipe: boolean = false): void {
    if (this.stats !== 'static' || (swipe && this.pinchzoom.scale > 1)) {
      return;
    }
    this.stats = 'left';
    if (this.current === this.urls.length - 1) {
      this.nextCurrent = 0;
    } else {
      this.nextCurrent = this.current + 1;
    }
    this.pinchzoom.reset();
    this.changeDetectorRef.detectChanges();
  }

  doCloseClick(event: any): void {
    let i = 0;
    let j = 0;
    const as = this.imgs.toArray();
    let n = null;
    while (i <= this.current) {
      if (this.loaded[i]) {
        if (i === this.current) {
          n = as[j].nativeElement;
        }
        j++;
      }
      i++;
    }
    if (n) {
      const rect = n.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
        return;
      }
    }
    this.dialogRef.close();
  }

  doReset(): void {
    this.pinchzoom.reset();
  }

  doMoveImageAnimDone(): void {
    this.current = this.nextCurrent;
    this.stats = 'static';
    this.changeDetectorRef.detectChanges();
  }

  doDownload(): void {
    const url = this.urls[this.current];
    let customName = this.image?.customFilenames?.length > 0 ? this.image?.customFilenames[this.current] : undefined;
    if (!customName && this.image?.urls?.length > 0) {
      const urlItem = this.image?.urls[this.current];
      if (typeof urlItem === 'object' && 'name' in urlItem) {
        customName = urlItem.name;
      }
    }

    this.httpClient
      .get(url, {
        observe: 'response',
        responseType: 'arraybuffer'
      })
      .subscribe(
        (next) => {
          const cd = next.headers.get('content-disposition');

          let filename = 'image.jpg';
          if (cd) {
            const res = FILENAME_REGEXP.exec(cd);
            filename = customName ?? res?.[1] ?? filename;
          }

          const type = next.headers.get('content-type') ?? 'image/jpeg';

          const blob = new Blob([next.body], { type });
          FileSaver.saveAs(blob, decodeURI(filename));
        },
        (err) => {
          console.error(`Failed to download image ${url}`, err);
          this.popupService.showError();
        }
      );
  }
}
