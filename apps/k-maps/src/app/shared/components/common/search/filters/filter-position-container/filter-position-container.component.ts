import { Component, forwardRef, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as lodash from 'lodash';
import { of, Subscription } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { MCIT_FILTER_CUSTOM_FILTER_CONFIG, MCIT_FILTER_CUSTOM_INITIAL_FILTER, MCIT_FILTER_CUSTOM_KEY } from '../filter-custom-container/filter-custom-container.component';
import { McitMeaningPipe } from '../../../common/pipes/meaning.pipe';
import { IFilterCustom } from '../../search-options';
import { ParkStructureAreaHttpService } from '../../../../../../../compound/src/app/business/services/park-structure-area-http.service';
import { ParkStructureSquareHttpService } from '../../../../../../../compound/src/app/business/services/park-structure-square-http.service';
import { ParkActivityType } from '../../../../../../../compound/src/app/business/domains/park-activity-type.domain';

export interface IPositionFilterModel {
  zone?:
    | {
        id: string;
        name: string;
        driveways: { _id: string; code: string }[];
      }[]
    | {
        id: string;
        name: string;
        driveways: { _id: string; code: string }[];
      };
  driveway?:
    | {
        _id: string;
        code: string;
      }[]
    | {
        _id: string;
        code: string;
      };
  square?:
    | {
        id: string;
        name: string;
      }[]
    | {
        id: string;
        name: string;
      };

  xSquare?: string[] | string;
  activityType?: string[] | string;
  checkboxChecked?: boolean;
  checkCoveredChecked?: boolean;
  checkCustomChecked?: boolean;
  checkWithChecked?: boolean;
}

@Component({
  selector: 'mcit-filter-position-search-container',
  templateUrl: './filter-position-container.component.html',
  styleUrls: ['./filter-position-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterPositionContainerComponent),
      multi: true
    },
    McitMeaningPipe
  ]
})
export class McitFilterPositionContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  groupForm: UntypedFormGroup;

  waitingZones = false;
  waitingDriveways = false;
  waitingSquares = false;

  zones: { id: string; name: string; description: string; driveways: { _id: string; code: string }[] }[];
  zone: { id: string; name: string; driveways: { _id: string; code: string }[] };
  zonesList: { id: string; name: string; driveways: { _id: any; code: string }[] }[] = [];

  driveways: { _id: string; code: string; area_code?: string; driveway_code?: string }[];
  driveway: { _id: string; code: string; area_code?: string };
  drivewaysList: { _id: string; code: string; area_code?: string }[] = [];

  squares: { id: string; name: string; area_code?: string; driveway_code?: string }[];
  square: { id: string; name: string; area_code?: string; driveway_code?: string };
  squaresList: { id: string; name: string; area_code?: string; driveway_code?: string }[] = [];

  xSquaresList = [];

  activityTypes = [];
  activityType: { id: string; name: string };
  activityTypesList = [];

  checkbox?: string;
  checkboxChecked?: boolean;
  checkCovered?: boolean;
  checkCoveredChecked?: boolean;
  checkCustom?: boolean;
  checkCustomChecked?: boolean;
  checkWith?: string;
  checkWithChecked?: boolean;

  private default: IPositionFilterModel;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_FILTER_CUSTOM_KEY) public key: string,
    @Inject(MCIT_FILTER_CUSTOM_FILTER_CONFIG) public filterConfig: IFilterCustom,
    @Inject(MCIT_FILTER_CUSTOM_INITIAL_FILTER) @Optional() public initialFilter: any,
    private formBuilder: UntypedFormBuilder,
    private parkStructureAreaHttpService: ParkStructureAreaHttpService,
    private parkStructureSquareHttpService: ParkStructureSquareHttpService
  ) {
    if (this.filterConfig?.custom?.data?.params?.checkbox) {
      this.checkbox = this.filterConfig?.custom?.data?.params?.checkbox;
    }
    if (this.filterConfig?.custom?.data?.params?.checkWith) {
      this.checkWith = this.filterConfig?.custom?.data?.params?.checkWith;
    }
    this.checkCovered = this.filterConfig?.custom?.data?.params?.checkCovered ?? false;
    this.checkCustom = this.filterConfig?.custom?.data?.params?.checkCustom ?? false;
    this.groupForm = this.formBuilder.group({
      zone: [null],
      driveway: [null],
      square: [null],
      xSquare: [null],
      activityType: [null],
      checkboxChecked: null,
      checkCoveredChecked: null,
      checkCustomChecked: null,
      checkWithChecked: null
    });
  }

  ngOnInit(): void {
    const value = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, this.default);
    const current = {};
    this.mappingExistingFilter(value);
    current['zone'] = null;
    current['driveway'] = null;
    current['square'] = null;
    current['xSquare'] = null;
    current['activityType'] = null;
    current['checkboxChecked'] = null;
    current['checkCoveredChecked'] = null;
    current['checkCustomChecked'] = null;

    this.groupForm.setValue(current);

    this.subscriptions.push(
      this.groupForm
        .get('zone')
        .valueChanges.pipe(
          debounceTime(300),
          tap(() => (this.waitingZones = true)),
          switchMap((v) =>
            v
              ? this.parkStructureAreaHttpService.search(v, {}, 1, 5, '_id,code,activity_type,driveways._id,driveways.code', '').pipe(
                  map((res) =>
                    res.body.map((r) => ({
                      id: r._id,
                      name: r.code,
                      description: r.activity_type,
                      driveways: r.driveways.sort((a, b) => a.code.localeCompare(b.code))
                    }))
                  ),
                  catchError((err) => of(null))
                )
              : of([])
          ),
          tap(() => (this.waitingZones = false))
        )
        .subscribe((next) => {
          this.zones = next;
        })
    );
  }

  async zoneOnFocus(): Promise<void> {
    await this.parkStructureAreaHttpService.search(this.groupForm.get('zone').value?.length > 2 ? this.groupForm.get('zone').value : '', {
      ...(this.groupForm.get('zone').value?.length <= 2 ? {starting_with: this.groupForm.get('zone').value} : {})
    }, 1, 5, '_id,code,activity_type,driveways._id,driveways.code', '').subscribe(
      (res) =>
        (this.zones = res.body.map((r) => ({
          id: r._id,
          name: r.code,
          description: r.activity_type,
          driveways: r.driveways.sort((a, b) => a.code.localeCompare(b.code))
        })))
    );
  }

  drivewayOnFocus(): void {
    const input = this.groupForm.value['driveway'];
    this.driveways = [];
    this.squares = [];
    this.zonesList.map((res) =>
      this.driveways.push(
        ...res.driveways
          .filter((driveway) => lodash.toLower(driveway.code).includes(lodash.toLower(input)))
          .map((r) => ({
            _id: r._id,
            code: r.code,
            area_code: res.name
          }))
      )
    );
  }

  squareOnFocus(): void {
    const input = this.groupForm.value['square'];
    this.squares = [];
    if (this.zonesList.length === 0 && this.drivewaysList.length === 0) {
      this.squares = [];
      return;
    }
    this.parkStructureSquareHttpService
      .search(input ?? '', { area_ids: lodash.compact(this.zonesList.map((zone) => zone.id)), driveway_ids: lodash.compact(this.drivewaysList.map((driveway) => driveway._id)) }, 1, 5, '_id,code,area_code,driveway_code', '')
      .subscribe((res) => res.body.map((r) => this.squares.push({ id: r._id, name: r.code, area_code: r.area_code, driveway_code: r.driveway_code })));
  }

  activityTypeOnFocus(): void {
    this.activityTypes = Object.values(ParkActivityType);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private mappingExistingFilter(value: IPositionFilterModel): void {
    if (value?.zone) {
      if (lodash.isArray(value.zone)) {
        this.zonesList = lodash.cloneDeep(value?.zone);
      } else {
        this.zonesList = [];
        this.zonesList.push(value?.zone);
      }
    } else {
      this.zonesList = [];
    }
    if (value?.driveway) {
      if (lodash.isArray(value.driveway)) {
        this.drivewaysList = lodash.cloneDeep(value?.driveway);
      } else {
        this.drivewaysList = [];
        this.drivewaysList.push(value?.driveway);
      }
    } else {
      this.drivewaysList = [];
    }
    if (value?.square) {
      if (lodash.isArray(value.square)) {
        this.squaresList = lodash.cloneDeep(value?.square);
      } else {
        this.squaresList = [];
        this.squaresList.push(value?.square);
      }
    } else {
      this.squaresList = [];
    }
    if (value?.xSquare) {
      if (lodash.isArray(value.xSquare)) {
        this.xSquaresList = lodash.cloneDeep(value?.xSquare);
      } else {
        this.xSquaresList = [];
        this.xSquaresList.push(value?.xSquare);
      }
    } else {
      this.xSquaresList = [];
    }
    if (value?.activityType) {
      if (lodash.isArray(value.activityType)) {
        this.activityTypesList = lodash.cloneDeep(value?.activityType);
      } else {
        this.activityTypesList = [];
        this.activityTypesList.push(value?.activityType);
      }
    } else {
      this.activityTypesList = [];
    }
    if (value?.checkboxChecked != null) {
      this.checkboxChecked = value?.checkboxChecked;
    } else {
      this.checkboxChecked = null;
    }
    if (value?.checkCoveredChecked != null) {
      this.checkCoveredChecked = value?.checkCoveredChecked;
    } else {
      this.checkCoveredChecked = null;
    }
    if (value?.checkCustomChecked != null) {
      this.checkCustomChecked = value?.checkCustomChecked;
    } else {
      this.checkCustomChecked = null;
    }
    if (value?.checkWithChecked != null) {
      this.checkWithChecked = value?.checkWithChecked;
    } else {
      this.checkWithChecked = null;
    }
  }

  writeValue(value: any) {
    const v = value ? lodash.cloneDeep(value) : null;
    const res: any = {};
    this.mappingExistingFilter(v);
    res['zone'] = null;
    res['driveway'] = null;
    res['square'] = null;
    res['xSquare'] = null;
    res['activityType'] = null;
    res['checkboxChecked'] = null;
    res['checkCoveredChecked'] = null;
    res['checkCustomChecked'] = null;
    res['checkWithChecked'] = null;

    this.groupForm.setValue(lodash.defaultsDeep({}, res, this.default));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doClear(formControlName: string): void {
    this.groupForm.get(formControlName).setValue(null);
    if (formControlName === 'zone') {
      this.zones = null;
      this.driveways = null;
      this.squares = null;
    } else if (formControlName === 'driveway') {
      this.driveways = null;
    } else if (formControlName === 'square') {
      this.squares = null;
    } else if (formControlName === 'activityType') {
      this.activityType = null;
    } else if (formControlName === 'checkboxChecked') {
      this.checkboxChecked = null;
    } else if (formControlName === 'checkCoveredChecked') {
      this.checkCoveredChecked = null;
    } else if (formControlName === 'checkCustomChecked') {
      this.checkCustomChecked = null;
    } else if (formControlName === 'checkWithChecked') {
      this.checkWithChecked = null;
    }
  }

  doZoneSelected(event): void {
    const selectedZone = lodash.pick(event, ['id', 'name', 'description', 'driveways']);
    this.driveways = null;
    this.squares = null;

    this.zone = lodash.pick(event, ['id', 'name', 'description', 'driveways']);
    this.zonesList.push(this.zone);
    if (!this.zonesList.some((zone) => zone.id === selectedZone.id)) {
      this.zonesList.push(selectedZone);
    }

    this.propagateChangePosition();
    this.zones = null;
  }

  doDrivewaySelected(event): void {
    const selectedDriveway = lodash.pick(event, ['_id', 'code', 'area_code']);
    if (!this.drivewaysList.some((driveway) => driveway._id === selectedDriveway._id)) {
      this.drivewaysList.push(selectedDriveway);
    }
    this.groupForm.get('driveway').setValue(null);
    this.propagateChangePosition();
    this.driveways = null;
  }

  doSquareSelected(event): void {
    const selectedSquare = lodash.pick(event, ['id', 'name', 'area_code', 'driveway_code']);
    if (!this.squaresList.some((square) => square.id === selectedSquare.id)) {
      this.squaresList.push(selectedSquare);
    }
    this.groupForm.get('square').setValue(null);
    this.propagateChangePosition();
    this.squares = null;
  }

  doActivityTypeSelected(activityType): void {
    this.activityType = activityType;
    this.activityTypesList.push(this.activityType);
    this.groupForm.get('activityType').setValue(null);
    this.propagateChangePosition();
    this.activityTypes = null;
  }

  doCheckboxChecked(): void {
    if (this.checkboxChecked) {
      this.checkWithChecked = false;
      this.groupForm.get('checkWithChecked')?.setValue(false);
    }
    this.propagateChangePosition();
  }

  doCheckWithChecked(): void {
    if (this.checkWithChecked) {
      this.checkboxChecked = false;
      this.groupForm.get('checkboxChecked')?.setValue(false);
    }
    this.propagateChangePosition();
  }

  onKeyXsquare(event: KeyboardEvent): void {
    if (this.groupForm.get('xSquare').value !== '' && this.groupForm.get('xSquare').value !== null) {
      event.preventDefault();
      this.xSquaresList.push(this.groupForm.get('xSquare').value);
      this.groupForm.get('xSquare').setValue(null);
      this.propagateChangePosition();
    }
  }

  doRemove(list, index): void {
    list.splice(index, 1);
    this.propagateChangePosition();
    if (list === this.zonesList) {
      this.doClearList(this.drivewaysList);
      this.doClearList(this.squaresList);
    } else if (list === this.drivewaysList) {
      this.doClearList(this.squaresList);
    }
  }

  doClearList(list): void {
    list.splice(0, list.length);
    this.propagateChangePosition();
    if (list === this.zonesList) {
      this.doClearList(this.drivewaysList);
      this.doClearList(this.squaresList);
    } else if (list === this.drivewaysList) {
      this.doClearList(this.squaresList);
    }
  }

  private propagateChangePosition(): void {
    if (
      this.zonesList.length > 0 ||
      this.drivewaysList.length > 0 ||
      this.squaresList.length > 0 ||
      this.xSquaresList.length > 0 ||
      this.activityTypesList.length > 0 ||
      this.checkboxChecked ||
      this.checkCoveredChecked ||
      this.checkCustomChecked ||
      this.checkWithChecked
    ) {
      if ((this.checkbox && this.checkboxChecked) || (this.checkCovered && this.checkCoveredChecked) || (this.checkCustom && this.checkCustomChecked) || (this.checkWith && this.checkWithChecked)) {
        this.propagateChange({
          zone: this.zonesList,
          driveway: this.drivewaysList,
          square: this.squaresList,
          xSquare: this.xSquaresList,
          activityType: this.activityTypesList,
          ...(this.checkboxChecked ? { checkboxChecked: this.checkboxChecked } : {}),
          ...(this.checkCoveredChecked ? { checkCoveredChecked: this.checkCoveredChecked } : {}),
          ...(this.checkCustomChecked ? { checkCustomChecked: this.checkCustomChecked } : {}),
          ...(this.checkWithChecked ? { checkWithChecked: this.checkWithChecked } : {})
        });
      } else {
        this.propagateChange({
          zone: this.zonesList,
          driveway: this.drivewaysList,
          square: this.squaresList,
          xSquare: this.xSquaresList,
          activityType: this.activityTypesList
        });
      }
    } else {
      this.propagateChange(null);
    }
  }
}
