import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { McitPopupService } from '../services/popup.service';
import { IAutocompleteResult, PlacesHttpService } from '../services/places-http.service';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-place-field',
  templateUrl: './place-field.component.html',
  styleUrls: ['./place-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitPlaceFieldComponent),
      multi: true
    }
  ]
})
export class McitPlaceFieldComponent implements OnInit, ControlValueAccessor {
  private _required = false;

  @Input() placeholder: string;
  @Input() submitAttempt: boolean;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    this.placeFieldForm.get('place').setValidators(Validators.compose(lodash.compact([this.validatePlace(), _required ? Validators.required : null])));
  }

  get required(): boolean {
    return this._required;
  }

  @Output() placeEvent = new EventEmitter<any>();

  placeFieldForm: UntypedFormGroup;

  placeDataSource: Observable<IAutocompleteResult>;
  placeLoading = false;

  private place: any;
  private propagateChange: (_: any) => any;

  constructor(private formBuilder: UntypedFormBuilder, private popupService: McitPopupService, private placesHttpService: PlacesHttpService) {
    this.placeFieldForm = this.formBuilder.group({
      place: ['', Validators.compose(lodash.compact([this.validatePlace(), this.required ? Validators.required : null]))]
    });
  }

  ngOnInit(): void {
    this.placeDataSource = new Observable((observer: any) => {
      observer.next(this.placeFieldForm.controls['place'].value);
    }).pipe(switchMap((token: string) => this.getAutocompleteQuery$(token)));
  }

  private validatePlace(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (!c.value || this.place) {
        return null;
      }
      return { address: true };
    };
  }

  private getAutocompleteQuery$(input: string): Observable<any> {
    return this.placesHttpService.autocomplete(input, null).pipe(
      catchError((err, cause) => {
        this.popupService.showError();
        return EMPTY;
      })
    );
  }

  getPlaceErrorMessage(): string {
    const c = this.placeFieldForm.controls['place'];
    if (c.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    } else if (c.hasError('address')) {
      return 'COMMON.ADDRESS_IS_WRONG';
    }
    return null;
  }

  /**
   * Chargement en cours de la recherche des lieux
   */
  doChangePlaceLoading(event: boolean): void {
    this.placeLoading = event;
  }

  /**
   * Un lieu a été selectionné
   */
  doPlaceSelected(event): void {
    const place = event.item;
    this.loadPlace(place.place_id, place.name);
  }

  private loadPlace(placeId: string, name: string): void {
    this.placeLoading = true;

    this.placesHttpService.detail(placeId).subscribe(
      (next) => {
        this.placeLoading = false;

        this.place = {
          description: name,
          ...next
        };

        this.placeEvent.emit(this.place);

        this.placeFieldForm.controls['place'].updateValueAndValidity();

        this.propagateChange(name);
      },
      (err) => {
        this.placeLoading = false;

        this.popupService.showError();
      }
    );
  }

  /**
   * Efface le lieu enregistré
   */
  doClearPlace(): void {
    this.placeFieldForm.controls['place'].setValue(null);
    this.place = null;

    this.placeEvent.emit(null);

    this.propagateChange(null);
  }

  writeValue(value: any) {
    if (value && typeof value === 'string') {
      this.place = { description: value };
      this.placeFieldForm.controls['place'].setValue(value, { emitEvent: false });
    } else {
      this.place = null;
      this.placeFieldForm.controls['place'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.placeFieldForm.controls['place'].disable({ emitEvent: false });
    } else {
      this.placeFieldForm.controls['place'].enable({ emitEvent: false });
    }
  }
}
