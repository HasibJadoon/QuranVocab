import { Component, DestroyRef, forwardRef, Inject, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IAutocompleteResult, PlacesHttpService } from '../../../services/places-http.service';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { McitPopupService } from '../../../services/popup.service';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitDistanceService } from '../../../services/distance.service';
import { MCIT_FILTER_CUSTOM_FILTER_CONFIG, MCIT_FILTER_CUSTOM_INITIAL_FILTER, MCIT_FILTER_CUSTOM_KEY } from '@lib-shared/common/search/filters/filter-custom-container/filter-custom-container.component';
import { IFilterCustom } from '@lib-shared/common/search/search-options';
import * as lodash from 'lodash';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { McitFilterGeoWithinModalComponent } from '@lib-shared/common/search/filters/filter-geo-within-container/filter-geo-within-modal/filter-geo-within-modal.component';

export interface IGeoWithinFilterModel {
  base?: {
    name: string;
    latitude: number;
    longitude: number;
    isPoint: boolean;
  };
  radius?: number;
}

const DEFAULT: IGeoWithinFilterModel = {
  base: null,
  radius: null
};

@Component({
  selector: 'mcit-filter-geo-within-container',
  templateUrl: './filter-geo-within-container.component.html',
  styleUrls: ['./filter-geo-within-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterGeoWithinContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterGeoWithinContainerComponent implements OnInit, ControlValueAccessor {
  groupForm: UntypedFormGroup;

  waiting = false;

  input: string;
  inputSubject = new Subject<string>();
  unit: string;
  list: IAutocompleteResult[];

  private propagateChange: (_: any) => any;

  constructor(
    @Inject(MCIT_FILTER_CUSTOM_KEY) public key: string,
    @Inject(MCIT_FILTER_CUSTOM_FILTER_CONFIG) public filterConfig: IFilterCustom,
    @Inject(MCIT_FILTER_CUSTOM_INITIAL_FILTER) @Optional() public initialFilter: any,
    private popupService: McitPopupService,
    private placesHttpService: PlacesHttpService,
    private dialog: McitDialog,
    private formBuilder: UntypedFormBuilder,
    private distanceService: McitDistanceService,
    private destroyRef: DestroyRef
  ) {
    this.unit = this.distanceService.currentDistanceFormat.toLowerCase();
    this.groupForm = this.formBuilder.group({
      base: this.formBuilder.control(null, Validators.required),
      radius: this.formBuilder.control(null, Validators.compose([Validators.min(0), Validators.required]))
    });
  }

  ngOnInit(): void {
    const v = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, DEFAULT);

    this.groupForm.setValue(v);

    this.groupForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((next) => {
      if (this.propagateChange) {
        if (this.groupForm.valid && next) {
          this.propagateChange(next);
        } else {
          this.propagateChange(null);
        }
      }
    });

    this.inputSubject
      .asObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        tap(() => (this.waiting = true)),
        switchMap(() =>
          this.placesHttpService.autocomplete(this.input, null).pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(() => {
              this.waiting = false;
              this.popupService.showError();
              return EMPTY;
            }),
            tap((res) => {
              this.waiting = false;
              this.list = res;
            })
          )
        )
      )
      .subscribe();
  }

  writeValue(value: any) {
    this.list = null;
    if (value) {
      this.groupForm.setValue(lodash.defaultsDeep({}, value, DEFAULT));

      this.input = this.groupForm.get('base').value?.name;
    } else {
      this.groupForm.setValue(lodash.defaultsDeep({}, null, DEFAULT));

      this.input = '';
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doPlaceSelected(place: IAutocompleteResult): void {
    this.loadPlace(place.place_id, place.name);
  }

  private loadPlace(placeId: string, name: string): void {
    this.waiting = true;

    this.placesHttpService.detail(placeId).subscribe(
      (next) => {
        this.waiting = false;

        if (next.location?.lat != null && next.location?.lng != null) {
          this.groupForm.patchValue({ base: { name, latitude: next.location.lat, longitude: next.location.lng, isPoint: false } });
          this.input = name;
        }

        this.list = null;
      },
      () => {
        this.waiting = false;

        this.popupService.showError();
      }
    );
  }

  doClearPlace(): void {
    this.input = '';

    this.groupForm.patchValue({ base: null });
  }

  doBaseChange(): void {
    const base = this.groupForm.get('base').value;
    this.dialog
      .open(McitFilterGeoWithinModalComponent, {
        dialogClass: 'modal-lg',
        data: {
          position: base ? { name: base.name, lng: base.longitude, lat: base.latitude } : null,
          radius: this.groupForm.get('radius').value
        }
      })
      .afterClosed()
      .pipe(filter((res) => res != null))
      .subscribe((next) => {
        const lat = next.lat;
        const lng = next.lng;
        this.input = next.name ?? `${lat},${lng}`;

        this.groupForm.get('base').setValue({ name: this.input, latitude: lat, longitude: lng, isPoint: true });
      });
  }
}
