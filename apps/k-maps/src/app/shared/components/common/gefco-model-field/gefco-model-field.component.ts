import { ChangeDetectorRef, Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { McitMenuDropdownService } from '../menu-dropdown/menu-dropdown.service';
import { McitPopupService } from '../services/popup.service';
import { McitVehicleGefcoModelHttpService } from '../services/vehicle-gefco-model-http.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { IGefcoModel } from '../models/vehicle/gefco-model.model';

enum InputsName {
  MODEL = 'model',
  MAKE = 'make',
  ARTICLE = 'article',
  LINE = 'line',
  TYPE = 'type',
  ENGINE = 'engine',
  TRANSMISSION = 'transmission'
}

@Component({
  selector: 'mcit-gefco-model-field',
  templateUrl: './gefco-model-field.component.html',
  styleUrls: ['./gefco-model-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitGefcoModelFieldComponent),
      multi: true
    }
  ]
})
export class McitGefcoModelFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;
  @Input()
  set required(_required: boolean) {
    this._required = _required;
    this.groupForm.get(InputsName.MODEL).setValidators(_required ? Validators.required : null);
  }

  get required(): boolean {
    return this._required;
  }

  placeHolders: { [key: string]: string };
  groupForm: UntypedFormGroup;
  InputsNameRef = InputsName;
  dataSources: { [key: string]: Observable<any> };
  loadings: { [key: string]: boolean };
  currentModel: IGefcoModel;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService,
    private menuDropdownService: McitMenuDropdownService,
    private changeDetectorRef: ChangeDetectorRef,
    private gefcoModelHttpService: McitVehicleGefcoModelHttpService
  ) {
    this.groupForm = this.formBuilder.group({
      model: [''],
      make: [''],
      article: [''],
      line: [''],
      type: [''],
      engine: [''],
      transmission: ['']
    });
  }

  ngOnInit(): void {
    this.loadings = _.values(InputsName)
      .map((e) => ({ [e]: false }))
      .reduce(_.assign, {});

    this.dataSources = _.values(InputsName)
      .map((e) => ({ [e]: this.getDataSource(e) }))
      .reduce(_.assign, {});

    this.placeHolders = _.values(InputsName)
      .map((e) => ({ [e]: 'GEFCO_MODEL_FIELD.' + e.toUpperCase() }))
      .reduce(_.assign, {});
  }

  getDataSource(inputName: InputsName) {
    return new Observable((observer: any) => {
      observer.next(this.groupForm.controls[inputName].value);
    }).pipe(
      switchMap((token: string) => {
        let filters = _.pickBy(this.groupForm.getRawValue(), _.identity);
        if (inputName !== InputsName.MODEL) {
          filters = _.omit(filters, InputsName.MODEL);
        }
        return this.gefcoModelHttpService.searchField(inputName, filters, 1, 10).pipe(
          map((resp) => resp.body),
          catchError((err, cause) => {
            this.popupService.showError();
            return EMPTY;
          })
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  doLoading(event: boolean, inputName: InputsName): void {
    this.loadings[inputName] = event;
  }

  doModelSelected(event): void {
    const code = event.item.code;
    this.loadings[InputsName.MODEL] = true;

    this.gefcoModelHttpService.get(code).subscribe(
      (next) => {
        this.loadings[InputsName.MODEL] = false;
        this.groupForm.controls[InputsName.MODEL].updateValueAndValidity();
        this.currentModel = next;
        this.propagateChange(next);
      },
      (err) => {
        this.loadings[InputsName.MODEL] = false;
        this.popupService.showError();
      }
    );
  }

  getModelErrorMessage(): string {
    const c = this.groupForm.controls[InputsName.MODEL];
    if (c.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    }
    return null;
  }

  doClear(inputName: InputsName): void {
    this.groupForm.controls[inputName].setValue(null);
    if (inputName === InputsName.MODEL) {
      this.currentModel = null;
      this.propagateChange(null);
    }
  }

  writeValue(value: IGefcoModel) {
    if (value) {
      this.currentModel = value;
      this.groupForm.get(InputsName.MODEL).setValue(value.meaning);
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.groupForm.disable({ emitEvent: false });
    } else {
      this.groupForm.enable({ emitEvent: false });
    }
  }
}
