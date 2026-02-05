import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IAddedOrSelectedPointEmitter, SvgComponentType, VehicleElementType, WheelPosition } from '../svg-vehicle-damages.service';
import { DataPoint, Point } from '../../svg-map/svg-map.component';
import { McitExternalVehicleSvgComponent } from '../external-vehicle-svg/external-vehicle-svg.component';
import { McitInternalVehicleSvgComponent } from '../internal-vehicle-svg/internal-vehicle-svg.component';

@Component({
  selector: 'mcit-internal-external-vehicle-svg',
  templateUrl: './internal-external-vehicle-svg.component.html',
  styleUrls: ['./internal-external-vehicle-svg.component.scss']
})
export class McitInternalExternalVehicleSvgComponent implements OnInit {
  public vehicleElementType = {
    INTERNAL: VehicleElementType.INTERNAL,
    EXTERNAL: VehicleElementType.EXTERNAL
  };

  @Input() damageType: VehicleElementType | string = this.vehicleElementType.EXTERNAL;
  @Input() displayInternalExternalSwitchButton = true;
  @Input() displaySwitchWheelPositionButton = false;
  @Input() svgComponentType: SvgComponentType = SvgComponentType.COMMON;
  @Input() editable = false;
  @Input() externalPoints: (Point | DataPoint | Partial<Point>)[];
  @Input() internalPoints: (Point | DataPoint | Partial<Point>)[];
  @Input() wheelPosition: WheelPosition | string | undefined = WheelPosition.LEFT;

  @Output() damageLocationAdded = new EventEmitter<IAddedOrSelectedPointEmitter>();
  @Output() damageLocationSelected = new EventEmitter<IAddedOrSelectedPointEmitter>();
  @Output() zoneChanged = new EventEmitter<VehicleElementType | string>();
  @Output() wheelPositionChanged = new EventEmitter<WheelPosition>();

  @ViewChild('externalVehicleSvgComponent', { static: false })
  externalVehicleSvgComponent: McitExternalVehicleSvgComponent;
  @ViewChild('internalVehicleSvgComponent', { static: false })
  internalVehicleSvgComponent: McitInternalVehicleSvgComponent;

  constructor() {}

  ngOnInit(): void {}

  refresh(): void {
    setTimeout(() => {
      if (this.damageType === VehicleElementType.EXTERNAL && this.externalVehicleSvgComponent) {
        this.externalVehicleSvgComponent.svg.refresh();
      } else if (this.damageType === VehicleElementType.INTERNAL && this.internalVehicleSvgComponent) {
        this.internalVehicleSvgComponent.svg.refresh();
      }
    });
  }

  doChangeZoneType(type: VehicleElementType): void {
    this.damageType = type;
    this.refresh();
    this.zoneChanged.emit(type);
  }

  damageLocationAddedFct(event: IAddedOrSelectedPointEmitter) {
    if (this.editable) {
      this.damageLocationAdded.emit(event);
    }
  }

  damageLocationSelectedFct(event: IAddedOrSelectedPointEmitter) {
    this.damageLocationSelected.emit(event);
  }

  wheelPositionChangedFct(position: WheelPosition) {
    this.wheelPositionChanged.emit(position);
  }
}
