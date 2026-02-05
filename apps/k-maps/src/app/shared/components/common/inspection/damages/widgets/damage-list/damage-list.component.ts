import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';

import { IVehicleDeclaredDamage, IVehicleElement, IVehicleInspectionElement } from '../../../inspection.model';
import { McitInternalExternalVehicleSvgComponent } from '../../../../svg-vehicle-damages/internal-external-vehicle-svg/internal-external-vehicle-svg.component';
import { DataPoint } from '../../../../svg-map/svg-map.component';
import { WheelPosition } from '../../../../svg-vehicle-damages/svg-vehicle-damages.service';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-damage-list',
  templateUrl: './damage-list.component.html',
  styleUrls: ['./damage-list.component.scss'],
  animations: [
    trigger('changeDivSize', [
      state(
        'initial',
        style({
          transform: 'scale(1)'
        })
      ),
      state(
        'final',
        style({
          transform: 'scale(1.05)'
        })
      ),
      transition('initial=>final', animate('2000ms')),
      transition('final=>initial', animate('1500ms'))
    ])
  ]
})
export class McitDamageListComponent implements OnInit, OnDestroy {
  public typeRef = { INTERNAL: 'INT', EXTERNAL: 'EXT' };

  @ViewChild('internalExternalVehicleSvgComponent', { static: false })
  internalExternalVehicleSvgComponent: McitInternalExternalVehicleSvgComponent;

  @Input() step;
  @Input() damageType = this.typeRef.EXTERNAL;
  @Input() editable = false;
  @Input() showNonDamagedElements = false;
  @Input() damageList: Array<IVehicleInspectionElement> = [];
  @Input() nonDamagedElements = {
    INT: [] as Array<IVehicleElement>,
    EXT: [] as Array<IVehicleElement>
  };
  @Input() forceVertical = false;
  @Input() canvasDefaultScale: number;
  @Input() vehicleData: {
    rtoId: string;
    manifestId: string;
    vehicleId: string;
    wheelPosition?: WheelPosition;
  };
  @Input() disableClick = false;

  @Output() newDamageSelected = new EventEmitter<any>();
  @Output() zoneChanged = new EventEmitter<string>();
  @Output() damageClicked = new EventEmitter<{
    _id: string;
    rtoId: string;
    manifestId: string;
    vehicleId: string;
    type: string;
    zone: number;
    step: string;
    wheelPosition?: WheelPosition;
  }>();

  private destroy$: Subject<boolean> = new Subject<boolean>();
  public animation = 'initial';
  public externalDamageLocations: DataPoint[];
  public internalDamageLocations: DataPoint[];

  constructor() {}

  ngOnInit() {
    this.updateInternalAndExternalDamagesPoints();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  doShowDamage(damage: IVehicleDeclaredDamage | any) {
    this.damageClicked.emit({
      _id: damage._id,
      rtoId: this.vehicleData.rtoId,
      manifestId: this.vehicleData.manifestId,
      vehicleId: this.vehicleData.vehicleId,
      type: damage.type,
      zone: damage.zone,
      step: this.step,
      wheelPosition: this.vehicleData.wheelPosition
    });
  }

  doChangeZoneType(type): void {
    this.damageType = type;
    this.zoneChanged.emit(this.damageType);
    this.updateInternalAndExternalDamagesPoints();
  }

  updateInternalAndExternalDamagesPoints(): void {
    this.externalDamageLocations = this._computeDamagesLocations(this.typeRef.EXTERNAL);
    this.internalDamageLocations = this._computeDamagesLocations(this.typeRef.INTERNAL);
    if (this.internalExternalVehicleSvgComponent) {
      this.internalExternalVehicleSvgComponent.refresh();
    }
  }

  private _computeDamagesLocations(intExt: string): DataPoint[] {
    if (this.damageList) {
      return this.damageList
        .filter((declaredDamage: IVehicleDeclaredDamage) => declaredDamage.type && intExt.toUpperCase() === declaredDamage.type.toUpperCase())
        .map((declaredDamage: IVehicleDeclaredDamage) =>
          declaredDamage.coordinates
            ? new DataPoint({
                x: declaredDamage.coordinates.x,
                y: declaredDamage.coordinates.y,
                data: this.damageList.indexOf(declaredDamage) + 1
              })
            : null
        );
    }
    return [];
  }

  wheelPositionChanged(position: WheelPosition) {
    this.vehicleData.wheelPosition = position;
  }
}
