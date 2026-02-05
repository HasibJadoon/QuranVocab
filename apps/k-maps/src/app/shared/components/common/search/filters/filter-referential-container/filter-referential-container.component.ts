import { Component, forwardRef, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as lodash from 'lodash';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, map, switchMap, take, tap } from 'rxjs/operators';
import { MCIT_FILTER_CUSTOM_FILTER_CONFIG, MCIT_FILTER_CUSTOM_INITIAL_FILTER, MCIT_FILTER_CUSTOM_KEY } from '../filter-custom-container/filter-custom-container.component';
import { McitMeaningPipe } from '../../../common/pipes/meaning.pipe';
import { IFilterCustom } from '../../search-options';
import { DamageReferentialHttpService } from '@business-fvl/services/damage-referential/damage-referential-http.service';
import { DamageClassHttpService } from '@business-fvl/services/damage-class/damage-class-http.service';

export interface IReferential {
  id: string;
  name: string;
}

export interface IDamage {
  id: string;
  code: string;
  meaning: string;
}

export interface IReferentialFilterModel {
  referential?: IReferential;
  damage?: IDamage;
}

@Component({
  selector: 'mcit-filter-referential-search-container',
  templateUrl: './filter-referential-container.component.html',
  styleUrls: ['./filter-referential-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterReferentialContainerComponent),
      multi: true
    },
    McitMeaningPipe
  ]
})
export class McitFilterReferentialContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  groupForm: UntypedFormGroup;

  waitingReferentials = false;
  waitingDamages = false;

  referentials: IReferential[];
  referential: IReferential;
  referentialsList: IReferential[] = [];

  damages: IDamage[];
  damage: IDamage;
  damagesList: IDamage[] = [];

  damageClassSelected = false;

  private default: IReferentialFilterModel;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_FILTER_CUSTOM_KEY) public key: string,
    @Inject(MCIT_FILTER_CUSTOM_FILTER_CONFIG) public filterConfig: IFilterCustom,
    @Inject(MCIT_FILTER_CUSTOM_INITIAL_FILTER) @Optional() public initialFilter: any,
    private formBuilder: UntypedFormBuilder,
    private damageReferentialHttpService: DamageReferentialHttpService,
    private damageClassHttpService: DamageClassHttpService
  ) {
    this.groupForm = this.formBuilder.group({
      referential: [null],
      damage: [null]
    });
  }

  ngOnInit(): void {
    const value = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, this.default);
    const current = {};
    this.mappingExistingFilter(value);
    current['referential'] = null;
    current['damage'] = null;
    this.groupForm.setValue(current);
    this.initGetReferentialsListObs();
    this.initGetDamagesListObs();
  }

  private initGetReferentialsListObs() {
    const referentialListObs = this.groupForm
      .get('referential')
      .valueChanges.pipe(
        debounceTime(300),
        tap(() => (this.waitingReferentials = true)),
        switchMap((v) => (v ? this.getReferentialListObs(v) : of([]))),
        tap(() => (this.waitingReferentials = false))
      )
      .subscribe((next) => {
        this.referentials = next;
      });
    this.subscriptions.push(referentialListObs);
  }

  private getReferentialListObs(v: string): Observable<any> {
    return this.damageReferentialHttpService.search(v, {}, 1, 5, 'meaning', 'code').pipe(
      take(1),
      map((res) =>
        res.body.map((r) => ({
          id: r._id,
          name: r.meaning
        }))
      ),
      catchError((err) => of(null))
    );
  }

  private initGetDamagesListObs() {
    const getDamagesListObs = this.groupForm
      .get('damage')
      .valueChanges.pipe(
        debounceTime(300),
        tap(() => (this.waitingDamages = true)),
        switchMap((v) => this.getDamageClassListObs(v)),
        tap(() => (this.waitingDamages = false))
      )
      .subscribe((next) => {
        this.damages = next;
      });
    this.subscriptions.push(getDamagesListObs);
  }

  private getDamageClassListObs(v: string): Observable<any> {
    if (!this.damageClassSelected) {
      return this.damageClassHttpService.search(v || '', { referential_id: this.referentialsList[0].id }, 1, 5, 'meaning,code', 'code').pipe(
        take(1),
        map((res) =>
          res.body.map((r) => ({
            code: r.code,
            meaning: r.meaning
          }))
        ),
        catchError(() => of(null)) // Handle errors by returning null
      );
    } else {
      return of([]);
    }
  }

  async referentialOnFocus(): Promise<void> {
    this.getReferentialList();
  }

  private async getReferentialList(): Promise<any> {
    return this.damageReferentialHttpService
      .search(this.groupForm.get('referential').value ?? '', {}, 1, 5, 'meaning', 'code')
      .pipe(take(1))
      .subscribe(
        (res) =>
          (this.referentials = res.body.map((r) => ({
            id: r._id,
            name: r.meaning
          })))
      );
  }

  damageOnFocus(): void {
    if (!this.groupForm.get('damage').value) {
      this.getDamageClassList();
    }
  }

  private async getDamageClassList(): Promise<any> {
    return this.damageClassHttpService
      .search(this.groupForm.get('damage').value || '', { referential_id: this.referentialsList[0].id }, 1, 5, 'code,meaning', 'code')
      .pipe(take(1))
      .subscribe(
        (res) =>
          (this.damages = res.body.map((r) => ({
            id: r._id,
            code: r.code,
            meaning: r.meaning
          })))
      );
  }

  public inputOnBlur() {
    setTimeout(() => {
      this.referentials = [];
      this.damages = [];
    }, 300);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private mappingExistingFilter(value: IReferentialFilterModel): void {
    if (value?.referential) {
      if (lodash.isArray(value.referential)) {
        this.referentialsList = lodash.cloneDeep(value?.referential);
      } else {
        this.referentialsList = [];
        this.referentialsList.push(value?.referential);
      }
    } else {
      this.referentialsList = [];
    }
    if (value?.damage) {
      if (lodash.isArray(value.damage)) {
        this.damagesList = lodash.cloneDeep(value?.damage);
      } else {
        this.damagesList = [];
        this.damagesList.push(value?.damage);
      }
    } else {
      this.damagesList = [];
    }
  }

  writeValue(value: any) {
    const v = value ? lodash.cloneDeep(value) : null;
    const res: any = {};
    this.mappingExistingFilter(v);
    res['referential'] = null;
    res['damage'] = null;
    this.groupForm.setValue(lodash.defaultsDeep({}, res, this.default));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doClear(formControlName: string): void {
    this.groupForm.get(formControlName).setValue(null);
    if (formControlName === 'referential') {
      this.referentials = null;
      this.damages = null;
    } else if (formControlName === 'damage') {
      this.damages = null;
    }
  }

  doReferentialSelected(event): void {
    const selectedReferential = lodash.pick(event, ['id', 'name']);
    this.damages = [];
    this.damagesList = [];
    this.groupForm.get('referential').setValue('');
    this.referentialsList = [selectedReferential];
    this.propagateChangePosition();
    this.referentials = null;
  }

  doDamageSelected(event): void {
    this.damageClassSelected = true;
    if (!this.damagesList.some((d) => d.code === event.code)) {
      this.damagesList.push(event);
    }
    this.groupForm.get('damage').setValue('');
    this.propagateChangePosition();
    this.damages = null;
    setTimeout(() => {
      this.damageClassSelected = false;
    }, 500);
  }

  doRemove(list, index): void {
    list.splice(index, 1);
    this.propagateChangePosition();
    if (list === this.referentialsList) {
      this.doClearList(this.damagesList);
    }
  }

  doClearList(list): void {
    list.splice(0, list.length);
    this.propagateChangePosition();
    if (list === this.referentialsList) {
      this.doClearList(this.damagesList);
    }
  }

  private propagateChangePosition(): void {
    if (this.referentialsList.length > 0 || this.damagesList.length > 0) {
      this.propagateChange({
        referential: this.referentialsList,
        damage: this.damagesList
      });
    } else {
      this.propagateChange(null);
    }
  }
}
