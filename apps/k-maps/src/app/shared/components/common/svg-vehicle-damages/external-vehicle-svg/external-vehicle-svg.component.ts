import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  EXTERNAL_VEHICLE_SVG_HEIGHT,
  EXTERNAL_VEHICLE_SVG_WIDTH,
  EXTERNAL_VEHICLE_SVG_ZONES,
  EXTERNAL_VEHICLE_COMPOUND_SVG_ZONES,
  IAddedOrSelectedPointEmitter,
  McitSvgVehicleDamageService,
  SvgComponentType,
  VehicleElementType
} from '../svg-vehicle-damages.service';
import { DataPoint, McitSvgMapComponent, Point } from '../../svg-map/svg-map.component';

@Component({
  selector: 'mcit-external-vehicle-svg',
  templateUrl: './external-vehicle-svg.component.html',
  styleUrls: ['./external-vehicle-svg.component.scss']
})
export class McitExternalVehicleSvgComponent implements OnInit {
  private _points: (Point | DataPoint)[] = [];
  vehicleType: VehicleElementType.EXTERNAL = VehicleElementType.EXTERNAL;

  get points(): (Point | DataPoint | { x?: number; y?: number })[] {
    return this._points;
  }

  @Input()
  set points(points: (Point | DataPoint | { x?: number; y?: number })[]) {
    if (Array.isArray(points)) {
      this._points = points
        .filter((point) => point && !Number.isNaN(point?.x) && !Number.isNaN(point?.y))
        .map((point: Point | DataPoint) => {
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

  @Input() editable = false;
  @Input() svgComponentType: SvgComponentType = SvgComponentType.COMMON;
  @Input() svgSource = `./assets/damages/zone_ext.svg`;
  @Input() viewportWidth: number = EXTERNAL_VEHICLE_SVG_WIDTH;
  @Input() viewportHeight: number = EXTERNAL_VEHICLE_SVG_HEIGHT;
  @Input() zones: string[] = EXTERNAL_VEHICLE_SVG_ZONES;

  @Output() damageLocationAdded = new EventEmitter<IAddedOrSelectedPointEmitter>();
  @Output() damageLocationSelected = new EventEmitter<IAddedOrSelectedPointEmitter>();

  @ViewChild('svg', { static: false }) svg: McitSvgMapComponent;

  constructor(private svgVehicleDamageService: McitSvgVehicleDamageService) {}

  ngOnInit(): void {
    if (this.svgComponentType === SvgComponentType.COMPOUND) {
      this.svgSource = `./assets/damages/compound/zone_ext.svg`;
      this.zones = EXTERNAL_VEHICLE_COMPOUND_SVG_ZONES;
    }
  }

  damageLocationAddedFct(point: Point, selectedZone: string | number) {
    if (this.editable) {
      this.damageLocationAdded.emit({ point, type: this.vehicleType, zone: selectedZone });
    }
  }

  damageLocationSelectedFct(point: Point, selectedZone: string | number) {
    this.damageLocationSelected.emit({ point, type: this.vehicleType, zone: selectedZone });
  }

  addDamageWithoutLocation() {
    if (this.editable) {
      this.damageLocationAdded.emit({ point: null, type: this.vehicleType, zone: null });
    }
  }
}
