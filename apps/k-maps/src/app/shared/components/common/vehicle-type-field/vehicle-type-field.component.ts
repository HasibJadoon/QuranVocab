import { AfterViewInit, ChangeDetectorRef, Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import * as lodash from 'lodash';
import { merge, of, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { McitMenuDropdownService } from '../menu-dropdown/menu-dropdown.service';
import { McitPopupService } from '../services/popup.service';
import { IVehicleMake } from '../services/vehicle-makes-http.service';
import { IVehicleModel, IVehicleShape } from '../services/vehicle-models-http.service';
import { McitVehicleTypeCacheService } from './vehicle-type-cache.service';
import { CodificationHttpService } from '../../../../../supervision/src/app/business/services/codification-http.service';
import { CodificationKind } from '../../../../../fvl/src/app/shared/components/codification-search-field/codification-search-field.component';
import { IGefcoModel } from '../models/vehicle/gefco-model.model';
import { McitVehicleGefcoModelHttpService } from '../services/vehicle-gefco-model-http.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'mcit-vehicle-type-field',
  templateUrl: './vehicle-type-field.component.html',
  styleUrls: ['./vehicle-type-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitVehicleTypeFieldComponent),
      multi: true
    }
  ]
})
export class McitVehicleTypeFieldComponent implements OnInit, OnDestroy, ControlValueAccessor, AfterViewInit {
  private _required = false;

  @Input() isDisabled = false;
  @Input() size: 'normal' | 'small' | 'large' = 'normal';
  @Input() forceBorder = false;
  @Input() submitAttempt: boolean;
  @Input() showModel = true;
  @Input() showCodification = false;
  @Input() useGefcoModel = false;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.vehicleFieldForm.get('_maker').setValidators(Validators.compose(lodash.compact([_required ? Validators.required : null])));
    this.vehicleFieldForm.get('_model').setValidators(Validators.compose(lodash.compact([_required ? Validators.required : null])));
    this.vehicleFieldForm.get('_gefco_model').setValidators(Validators.compose(lodash.compact([_required && this.useGefcoModel ? Validators.required : null])));
  }

  get required(): boolean {
    return this._required;
  }

  vehicleFieldForm: UntypedFormGroup;
  loading = false;

  makes: IVehicleMake[] = [];
  models: IVehicleModel[] = [];
  shapes: IVehicleShape[] = [];
  gefcoModels: Partial<IGefcoModel>[] = [];
  selectedShape = 'none';
  selectedGefcoModel = 'none';
  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];
  CodificationKindRef = CodificationKind;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private vehicleTypeCacheService: McitVehicleTypeCacheService,
    private popupService: McitPopupService,
    private menuDropdownService: McitMenuDropdownService,
    private changeDetectorRef: ChangeDetectorRef,
    private codificationHttpService: CodificationHttpService,
    private gefcoModelHttpService: McitVehicleGefcoModelHttpService
  ) {
    this.vehicleFieldForm = this.formBuilder.group({
      _maker: ['', Validators.compose(lodash.compact([this._required ? Validators.required : null]))],
      _maker_codification: [''],
      _maker_x_code: [''],
      _model: ['', Validators.compose(lodash.compact([this._required ? Validators.required : null]))],
      _model_codification: [''],
      _model_x_code: [''],
      _shape: [''],
      _gefco_model: ['', Validators.compose(lodash.compact([this._required && this.useGefcoModel ? Validators.required : null]))]
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.vehicleFieldForm.get('_model').valueChanges.subscribe((next) => {
        this.vehicleFieldForm.get('_shape').setValue('');
        this.update();
        this.refreshShapes();
        if (this.useGefcoModel) {
          this.refreshGefcoModels();
        }
      })
    );

    this.subscriptions.push(
      this.vehicleFieldForm.get('_maker').valueChanges.subscribe((next) => {
        this.models = [];
        this.vehicleFieldForm.get('_model').setValue('');
        this.update();
        this.refreshModels();
      })
    );

    this.subscriptions.push(
      this.vehicleFieldForm.get('_shape').valueChanges.subscribe((next) => {
        this.update();
        if (this.useGefcoModel) {
          this.refreshGefcoModels();
        }
      })
    );

    this.subscriptions.push(
      this.vehicleFieldForm.get('_gefco_model').valueChanges.subscribe((next) => {
        this.update();
      })
    );

    if (this.showCodification) {
      merge(
        this.vehicleFieldForm.get('_maker_codification').valueChanges,
        this.vehicleFieldForm.get('_maker_x_code').valueChanges,
        this.vehicleFieldForm.get('_model_codification').valueChanges,
        this.vehicleFieldForm.get('_model_x_code').valueChanges
      ).subscribe((next) => this.update());
    }

    this.setDisabledState(this.isDisabled);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loading = true;
      this.vehicleTypeCacheService.getAllMakes().subscribe(
        (next) => {
          this.loading = false;
          this.makes = next;

          this.refreshModels();
        },
        (err) => {
          this.loading = false;

          this.popupService.showError();

          this.makes = [];

          this.refreshModels();
        }
      );
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private update(): void {
    this.vehicleFieldForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    if (this.vehicleFieldForm.valid || this.vehicleFieldForm.disabled) {
      const ma = this.makes ? this.makes.find((make) => make && make.code === this.vehicleFieldForm.get('_maker').value) : null;
      const mo = this.models ? this.models.find((model) => model && model.code === this.vehicleFieldForm.get('_model').value) : null;
      const sh = this.shapes ? this.shapes.find((shape) => shape && shape.code === this.vehicleFieldForm.get('_shape').value) : null;
      const gm = this.vehicleFieldForm.get('_gefco_model').value;

      if (!this.showCodification) {
        this.propagateChange({
          maker: ma
            ? {
                code: ma.code,
                name: ma.name
              }
            : null,
          model: mo
            ? {
                code: mo.code,
                name: mo.name,
                shape: sh
                  ? {
                      code: sh.code,
                      name: sh.name
                    }
                  : null
              }
            : null,
          gefco_model: gm ? gm : null
        });
      } else {
        this.propagateChange({
          maker: {
            code: ma?.code,
            name: ma?.name,
            codification_id: this.vehicleFieldForm.get('_maker_codification').value?._id,
            x_code: this.vehicleFieldForm.get('_maker_x_code').value
          },
          model: {
            code: mo?.code,
            name: mo?.name,
            codification_id: this.vehicleFieldForm.get('_model_codification').value?._id,
            x_code: this.vehicleFieldForm.get('_model_x_code').value,
            shape: sh
              ? {
                  code: sh.code,
                  name: sh.name
                }
              : null
          },
          gefco_model: gm ? gm : null
        });
      }
    } else {
      this.propagateChange(null);
    }
  }

  private refreshModels(): void {
    const value = this.vehicleFieldForm.get('_maker').value;
    if (!value || !this.makes || this.makes.length === 0) {
      this.models = [];
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.loading = true;
    of(this.makes.find((make) => make && make.code === value))
      .pipe(switchMap((make) => (make ? this.vehicleTypeCacheService.getAllModels(make._id) : of([]))))
      .subscribe(
        (next) => {
          this.loading = false;
          this.models = next;
          this.refreshShapes();
          if (this.useGefcoModel) {
            this.refreshGefcoModels();
          }
          this.update();
        },
        (err) => {
          this.loading = false;

          this.popupService.showError();

          this.models = [];
        }
      );
    this.changeDetectorRef.markForCheck();
  }

  private refreshShapes(): void {
    const value = this.vehicleFieldForm.get('_model').value;
    if (!value || !this.models || this.models.length === 0) {
      this.shapes = [];
      return;
    }

    of(this.models.find((model) => model && model.code === value)).subscribe((next) => {
      if (this.vehicleFieldForm.controls['_shape'].value) {
        this.selectedShape = this.vehicleFieldForm.controls['_shape'].value;
      } else {
        this.selectedShape = 'none';
      }
      this.shapes = next?.shapes ?? [];
      if (!this.shapes?.length) {
        this.vehicleFieldForm.get('_shape').setValue('');
      } else if (this.shapes?.length === 1) {
        this.vehicleFieldForm.get('_shape').setValue(this.shapes[0].code);
      }
    });
  }

  private refreshGefcoModels(): void {
    const maker = this.vehicleFieldForm.get('_maker').value;
    const model = this.vehicleFieldForm.get('_model').value;
    const shape = this.vehicleFieldForm.get('_shape').value;
    const gefcoModelControl = this.vehicleFieldForm.get('_gefco_model');
    if (!maker || !this.makes || this.makes.length === 0) {
      this.gefcoModels = [];
      gefcoModelControl.setValue('');
      this.changeDetectorRef.markForCheck();
      return;
    }
    if (!model || !this.models || this.models.length === 0) {
      this.gefcoModels = [];
      gefcoModelControl.setValue('');
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.loading = true;
    this.gefcoModelHttpService
      .search(
        '',
        '',
        '_id,model_code,meaning',
        {
          moveecar_vehicle_make: maker,
          moveecar_vehicle_model: model,
          moveecar_vehicle_shape: shape
        },
        1,
        10
      )
      .pipe(map((res: HttpResponse<Array<Partial<IGefcoModel>>>): Array<Partial<IGefcoModel>> => res.body))
      .subscribe(
        (next) => {
          this.loading = false;
          if (gefcoModelControl.value) {
            this.selectedGefcoModel = gefcoModelControl.value;
          } else {
            this.selectedGefcoModel = 'none';
          }
          this.gefcoModels = next ?? [];
          if (!this.gefcoModels?.length) {
            gefcoModelControl.setValue('');
          } else if (this.gefcoModels?.length === 1) {
            gefcoModelControl.setValue(this.gefcoModels[0]);
          } else if (gefcoModelControl.value) {
            gefcoModelControl.setValue(this.gefcoModels.find((gm) => gm._id === gefcoModelControl.value._id) ?? '');
          }
          this.update();
        },
        (err) => {
          this.loading = false;

          this.popupService.showError();

          this.gefcoModels = [];
        }
      );
    this.changeDetectorRef.markForCheck();
  }

  writeValue(value: any) {
    this.vehicleFieldForm.controls['_maker'].setValue(lodash.get(value, 'maker.code', ''), { emitEvent: false });
    this.vehicleFieldForm.controls['_model'].setValue(lodash.get(value, 'model.code', ''), { emitEvent: false });
    this.vehicleFieldForm.controls['_shape'].setValue(lodash.get(value, 'model.shape.code', ''), { emitEvent: false });
    this.vehicleFieldForm.controls['_gefco_model'].setValue(lodash.get(value, 'gefco_model', ''), { emitEvent: false });
    this.refreshModels();

    if (this.showCodification) {
      this.vehicleFieldForm.controls['_maker_x_code'].setValue(lodash.get(value, 'maker.x_code', ''), {
        emitEvent: false
      });
      this.vehicleFieldForm.controls['_model_x_code'].setValue(lodash.get(value, 'model.x_code', ''), {
        emitEvent: false
      });
      if (lodash.get(value, 'maker.codification_id')) {
        this.codificationHttpService.get(value.maker.codification_id).subscribe((next) => this.vehicleFieldForm.get('_maker_codification').setValue(next));
      } else {
        this.vehicleFieldForm.controls['_maker_codification'].setValue(null, { emitEvent: false });
      }
      if (lodash.get(value, 'model.codification_id')) {
        this.codificationHttpService.get(value.model.codification_id).subscribe((next) => this.vehicleFieldForm.get('_model_codification').setValue(next));
      } else {
        this.vehicleFieldForm.controls['_model_codification'].setValue(null, { emitEvent: false });
      }
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) {
      this.vehicleFieldForm.get('_maker').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_maker_codification').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_maker_x_code').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_model').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_model_codification').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_model_x_code').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_shape').disable({ emitEvent: false });
      this.vehicleFieldForm.get('_gefco_model').disable({ emitEvent: false });
    } else {
      this.vehicleFieldForm.get('_maker').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_maker_codification').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_maker_x_code').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_model').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_model_codification').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_model_x_code').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_shape').enable({ emitEvent: false });
      this.vehicleFieldForm.get('_gefco_model').enable({ emitEvent: false });
    }
  }

  doSelectShape(shapeButton): void {
    const options = [];
    options.push({ code: 'none', nameKey: 'VEHICLE_TYPE_FIELD.NONE_SHAPE' });
    this.shapes.forEach((s) => options.push({ code: s.code, nameKey: s.name, noTranslate: true }));
    this.menuDropdownService.chooseOptions(shapeButton, options, this.selectedShape).subscribe((next) => {
      if (next) {
        this.selectedShape = next;
        if (next !== 'none') {
          this.vehicleFieldForm.controls['_shape'].setValue(next);
        } else {
          this.vehicleFieldForm.controls['_shape'].setValue('');
        }
        this.update();
      }
    });
  }

  doSelectGefcoModel(gefcoModelButton): void {
    const options = [];
    options.push({ code: 'none', nameKey: 'VEHICLE_TYPE_FIELD.NONE_GEFCO_MODEL' });
    this.gefcoModels.forEach((m) => options.push({ code: m._id, nameKey: m.meaning, noTranslate: true }));
    this.menuDropdownService.chooseOptions(gefcoModelButton, options, this.selectedGefcoModel).subscribe((next) => {
      if (next) {
        this.selectedGefcoModel = next;
        this.vehicleFieldForm.controls['_gefco_model'].setValue(this.gefcoModels.find((m) => (m._id = next)) ?? '');
        this.update();
      }
    });
  }
}
