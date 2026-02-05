import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { McitImageViewerOverlayService } from '../../../../image-viewer-overlay/image-viewer-overlay.service';
import { Subject } from 'rxjs';
import { IVehicleInspectionElement } from '../../../inspection.model';
import { McitDamageService } from '../../damage.service';
import { McitInternalExternalVehicleSvgComponent } from '../../../../svg-vehicle-damages/internal-external-vehicle-svg/internal-external-vehicle-svg.component';
import { WheelPosition } from '../../../../svg-vehicle-damages/svg-vehicle-damages.service';
import { IAttachment } from '../../../../models/attachments.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-damage-show',
  templateUrl: './damage-show.component.html',
  styleUrls: ['./damage-show.component.scss'],
  animations: [trigger('pictures-anim', [transition('* => *', [query(':enter', [style({ opacity: 0, transform: 'scale(0,0)' }), stagger(100, [animate('.4s ease', style({ opacity: 1, transform: 'scale(1,1)' }))])], { optional: true })])])]
})
export class McitDamageShowComponent implements OnInit, OnDestroy {
  @Input() damagedElement: IVehicleInspectionElement;
  @Input() attachmentUrls: Array<string> = [];
  @Input() attachmentLocals: Array<IAttachment> = [];
  @Input() wheelPosition: WheelPosition;
  @ViewChild('internalExternalVehicleSvgComponent', { static: false })
  internalExternalVehicleSvgComponent: McitInternalExternalVehicleSvgComponent;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  public gridCols: number;
  public upload: boolean;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private changeDetectorRef: ChangeDetectorRef,
    private damageZoneService: McitDamageService,
    private imageViewerModalService: McitImageViewerOverlayService,
    private location: Location
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateGrids();
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.updateGrids();
    if (this.damagedElement) {
      this.upload = true;
      if (this.internalExternalVehicleSvgComponent) {
        this.internalExternalVehicleSvgComponent.refresh();
      }
    } else {
      this.location.back();
    }
  }

  private updateGrids(): void {
    if (this.breakpointObserver.isMatched('(max-width: 767px)')) {
      this.gridCols = 2;
    } else {
      this.gridCols = 5;
    }
  }

  doShowPictures(photoUrls: string[] | IAttachment[], index: number): void {
    this.imageViewerModalService.open({
      urls: photoUrls,
      current: index
    });
  }

  stopLoading() {
    this.upload = false;
  }
}
