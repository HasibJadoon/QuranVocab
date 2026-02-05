import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  IAddedOrSelectedPointEmitter,
  INTERNAL_VEHICLE_COMPOUND_SVG_ZONES,
  INTERNAL_VEHICLE_SVG_HEIGHT,
  INTERNAL_VEHICLE_SVG_WIDTH,
  INTERNAL_VEHICLE_SVG_ZONES,
  McitSvgVehicleDamageService,
  SvgComponentType,
  VehicleElementType,
  WheelPosition
} from '../svg-vehicle-damages.service';
import { DataPoint, McitSvgMapComponent, Point } from '../../svg-map/svg-map.component';

@Component({
  selector: 'mcit-internal-vehicle-svg',
  templateUrl: './internal-vehicle-svg.component.html',
  styleUrls: ['./internal-vehicle-svg.component.scss']
})
export class McitInternalVehicleSvgComponent implements OnInit {
  private _points: (Point | DataPoint | Partial<DataPoint>)[] = [];
  private _wheelPosition: WheelPosition = WheelPosition.LEFT;
  vehicleType: VehicleElementType.INTERNAL = VehicleElementType.INTERNAL;

  wheelPositionTypes = {
    LEFT: WheelPosition.LEFT,
    RIGHT: WheelPosition.RIGHT
  };

  @Input() displaySwitchWheelPositionButton = false;
  @Input() editable = false;
  @Input() svgComponentType: SvgComponentType = SvgComponentType.COMMON;
  @Input() svgSource = `./assets/damages/zone_int_${this.wheelPosition}.svg`;
  @Input() viewportWidth: number = INTERNAL_VEHICLE_SVG_WIDTH;
  @Input() viewportHeight: number = INTERNAL_VEHICLE_SVG_HEIGHT;
  @Input() zones: string[] = INTERNAL_VEHICLE_SVG_ZONES;
  @Output() damageLocationAdded = new EventEmitter<IAddedOrSelectedPointEmitter>();
  @Output() damageLocationSelected = new EventEmitter<IAddedOrSelectedPointEmitter>();
  @Output() wheelPositionChanged = new EventEmitter<WheelPosition>();

  @ViewChild('svg', { static: false }) svg: McitSvgMapComponent;

  constructor(private svgVehicleDamageService: McitSvgVehicleDamageService) {}

  get points(): (Point | DataPoint | Partial<DataPoint>)[] {
    return this._points;
  }

  @Input()
  set points(points: (Point | DataPoint | Partial<DataPoint>)[]) {
    if (Array.isArray(points)) {
      this._points = points
        .filter((point) => point && !Number.isNaN(point?.x) && !Number.isNaN(point?.y))
        .map((point: Point | DataPoint | Partial<DataPoint>) => {
          if(point?.x != undefined && point?.y != undefined) {
            if (this.svgVehicleDamageService.isOldCoordinates(point)) {
              const updatedCoordinates = this.svgVehicleDamageService.convertOldCoordinatesToActualSvgCoordinates(point, this.vehicleType);
              return new DataPoint({ x: updatedCoordinates.x, y: updatedCoordinates.y, data: (<DataPoint>point)?.data });
            } else {
              return point;
            }
          }
        });
    }
  }

  get wheelPosition(): WheelPosition {
    return this._wheelPosition;
  }

  @Input()
  set wheelPosition(position: WheelPosition) {
    if (position === WheelPosition.LEFT || position === WheelPosition.RIGHT) {
      this._wheelPosition = position;
      this.doChangeWheelPosition(position);
    }
  }

  ngOnInit(): void {
    if (this.svgComponentType === SvgComponentType.COMPOUND) {
      this.svgSource = `./assets/damages/compound/zone_int.svg`;
      this.zones = INTERNAL_VEHICLE_COMPOUND_SVG_ZONES;
    }
  }

  damageLocationAddedFct(point: Point, selectedZone: string | number) {
    if (this.editable) {
      this.damageLocationAdded.emit({ point, type: this.vehicleType, zone: selectedZone });
    }
  }

  addDamageWithoutLocation() {
    if (this.editable) {
      this.damageLocationAdded.emit({ point: null, type: this.vehicleType, zone: null });
    }
  }

  damageLocationSelectedFct(point: Point, selectedZone: string | number) {
    this.damageLocationSelected.emit({ point, type: this.vehicleType, zone: selectedZone });
  }

  doChangeWheelPosition(position: WheelPosition) {
    if (this.svgComponentType === SvgComponentType.COMPOUND) return;
    this._wheelPosition = position;
    this.svgSource = `./assets/damages/zone_int_${this.wheelPosition}.svg`;
    this.wheelPositionChanged.emit(position);
  }
}
