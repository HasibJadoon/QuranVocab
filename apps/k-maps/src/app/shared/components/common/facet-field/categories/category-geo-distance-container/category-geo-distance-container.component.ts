import { Component, forwardRef, Input, OnChanges, OnInit } from '@angular/core';
import { ICategoryGeoDistanceConfig, IFacetOptions } from '../../facet-options';
import { ICategoryLineModel } from '../../facet-model';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { IAutocompleteResult, PlacesHttpService } from '../../../services/places-http.service';
import { EMPTY, Observable } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { McitPopupService } from '../../../services/popup.service';
import { McitDialog } from '../../../dialog/dialog.service';
import { McitCategoryGeoDistanceModalComponent } from './category-geo-distance-modal/category-geo-distance-modal.component';
import { McitDistanceService } from '../../../services/distance.service';

@Component({
  selector: 'mcit-category-geo-distance-facet-container',
  templateUrl: './category-geo-distance-container.component.html',
  styleUrls: ['./category-geo-distance-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCategoryGeoDistanceContainerComponent),
      multi: true
    }
  ]
})
export class McitCategoryGeoDistanceContainerComponent implements OnInit, ControlValueAccessor, OnChanges {
  @Input()
  key: string;
  @Input()
  options: IFacetOptions;
  @Input()
  categoryConfig: ICategoryGeoDistanceConfig;
  @Input()
  data: ICategoryLineModel[];

  input = '';
  customForm: UntypedFormGroup;
  base: { name: string; latitude: number; longitude: number; isPoint: boolean };
  value: ICategoryGeoDistanceConfig['geoDistance']['boundaries'][number];

  placeDataSource: Observable<IAutocompleteResult>;
  placeLoading = false;
  private propagateChange: (_: any) => any;
  unit: string;
  customValue: boolean;
  shouldAutoCheck: boolean;

  constructor(private popupService: McitPopupService, private placesHttpService: PlacesHttpService, private dialog: McitDialog, private formBuilder: UntypedFormBuilder, private distanceService: McitDistanceService) {}

  ngOnInit(): void {
    this.unit = this.distanceService.currentDistanceFormat.toLowerCase();
    this.customForm = this.formBuilder.group(
      {
        min: ['', [Validators.required, Validators.pattern(/^(0|[1-9]\d*)?$/)]],
        max: ['', [Validators.required, Validators.pattern(/^(0|[1-9]\d*)?$/)]]
      },
      { validator: checkMinMax }
    );
    this.placeDataSource = new Observable((observer: any) => {
      observer.next(this.input);
    }).pipe(switchMap((token: string) => this.getAutocompleteQuery$(token)));
  }

  private getAutocompleteQuery$(input: string): Observable<any> {
    return this.placesHttpService.autocomplete(input, null).pipe(
      catchError((err, cause) => {
        this.popupService.showError();
        return EMPTY;
      })
    );
  }

  doCustomBoundary() {
    const min = this.distanceService.toKm(Number(this.customForm?.value?.min));
    const max = this.distanceService.toKm(Number(this.customForm?.value?.max));

    this.value = {
      value: min,
      min,
      max
    };
    this.customValue = true;
    this.customForm.markAsPristine();
    this.customForm.markAsUntouched();
    this.emit();
    this.customForm.reset();
  }

  writeValue(value: any) {
    if (value == null) {
      this.input = '';
      this.base = null;
      this.value = null;
      return;
    }

    this.input = value.base?.name;
    this.base = value.base;

    const boundaryFound = this.categoryConfig.geoDistance?.boundaries?.find((b) => b.value === value.gte && b.min === value.gte && b.max === value.lt);

    if (boundaryFound) {
      this.value = boundaryFound;
    } else if (value.gte >= 0) {
      this.value = { value: value.gte, min: value.gte, max: value.lt };
      this.customValue = true;
    } else {
      this.value = this.categoryConfig?.geoDistance?.boundaries?.find((b) => b.min === value.gte);
    }

    // On vérifie la configuration pour savoir si on doit autocheck
    if (this.categoryConfig?.geoDistance?.shouldAutoCheck) {
      this.shouldAutoCheck = true;
    }
  }

  /**
   * Détecte si 'data' n'est pas undefined & tick automatiquement la plage peuplée la plus proche
   * si besoin
   */
  ngOnChanges(changes): void {
    if (this.categoryConfig?.geoDistance?.shouldAutoCheck && this.shouldAutoCheck && changes.data) {
      if (this.data && this.data === changes.data.currentValue) {
        this.shouldAutoCheck = false;
        // setTimeout pour empêcher l'erreur: 'Expression has changed after it was checked'
        setTimeout(() => this.tickClosest(), 0);
      }
    }
  }

  private tickClosest(): void {
    const match = this.categoryConfig?.geoDistance?.boundaries.find((el) => el.value === this.data[0]._id);
    this.doCheckChange(match);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doChangePlaceLoading(event: boolean): void {
    this.placeLoading = event;
  }

  doPlaceSelected(event): void {
    const place = event.item;
    this.loadPlace(place.place_id, place.name);
  }

  private loadPlace(placeId: string, name: string): void {
    this.placeLoading = true;

    this.placesHttpService.detail(placeId).subscribe(
      (next) => {
        this.placeLoading = false;

        if (next.location?.lat != null && next.location?.lng != null) {
          this.base = { name, latitude: next.location.lat, longitude: next.location.lng, isPoint: false };
          this.value = null;

          this.emit();
        }
      },
      (err) => {
        this.placeLoading = false;

        this.popupService.showError();
      }
    );
  }

  doClearPlace(): void {
    this.input = '';
    this.base = null;
    this.value = null;

    this.emit();
  }

  doCheckChange(boundary: ICategoryGeoDistanceConfig['geoDistance']['boundaries'][number]): void {
    this.customForm.reset();
    this.customValue = false;
    this.value = this.value?.value === boundary.value ? null : boundary;

    this.emit();
  }

  doBaseChange(): void {
    this.dialog
      .open(McitCategoryGeoDistanceModalComponent, {
        dialogClass: 'modal-lg',
        data: {
          boundaries: this.categoryConfig.geoDistance.boundaries,
          position: this.base
            ? {
                name: this.base.name,
                lat: this.base.latitude,
                lng: this.base.longitude
              }
            : null
        }
      })
      .afterClosed()
      .pipe(filter((res) => res != null))
      .subscribe((next) => {
        const lat = next.lat;
        const lng = next.lng;
        this.input = next.name ?? `${lat},${lng}`;
        this.base = { name: this.input, latitude: lat, longitude: lng, isPoint: true };
        this.value = null;
        this.emit();
      });
  }

  private emit(): void {
    this.propagateChange(this.base ? { base: this.base, ...(this.value ? { gte: this.value.min, lt: this.value.max } : {}) } : null);
  }
}

const checkMinMax = (c: AbstractControl) => (Number(c.get('min').value) < Number(c.get('max').value) ? null : { invalidMinMax: true });
