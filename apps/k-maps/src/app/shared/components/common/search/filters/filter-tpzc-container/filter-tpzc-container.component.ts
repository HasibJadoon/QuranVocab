import { Component, forwardRef, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as lodash from 'lodash';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { MCIT_FILTER_CUSTOM_FILTER_CONFIG, MCIT_FILTER_CUSTOM_INITIAL_FILTER, MCIT_FILTER_CUSTOM_KEY } from '../filter-custom-container/filter-custom-container.component';
import { McitCountriesHttpService } from '../../../services/countries-http.service';
import { McitMeaningPipe } from '../../../common/pipes/meaning.pipe';
import { IMeaning } from '../../../models/types.model';
import { PlacesHttpService } from '../../../services/places-http.service';
import { GeoZoneHttpService } from '../../../geo-zones/geo-zones-http.service';
import { ITpzcContainer } from '../../search-options';

export enum ThirdPartyOperator {
  IN = 'IN',
  NOT_IN = 'NOT_IN'
}

export interface ITpzcFilterModel {
  third_party?:
    | {
        id: string;
        name: string;
      }[]
    | {
        id: string;
        name: string;
      };
  third_party_operator?: ThirdPartyOperator;
  place?:
    | {
        id: string;
        name: string;
      }[]
    | {
        id: string;
        name: string;
      };
  place_operator?: ThirdPartyOperator;
  zip?:
    | {
        zip: string;
      }[]
    | {
        zip: string;
      };
  zip_operator?: ThirdPartyOperator;
  city?:
    | {
        city: string;
      }[]
    | {
        city: string;
      };
  city_operator?: ThirdPartyOperator;
  country?:
    | {
        code: string;
        name: string;
      }[]
    | {
        code: string;
        name: string;
      };
  country_operator?: ThirdPartyOperator;
  zone?:
    | {
        id: string;
        name: string;
      }[]
    | {
        id: string;
        name: string;
      };
  zone_operator?: ThirdPartyOperator;
  state?:
    | {
        state: string;
      }[]
    | {
        state: string;
      };
  state_operator?: ThirdPartyOperator;
  checkboxChecked?: boolean;
}

@Component({
  selector: 'mcit-filter-tpzc-search-container',
  templateUrl: './filter-tpzc-container.component.html',
  styleUrls: ['./filter-tpzc-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterTpzcContainerComponent),
      multi: true
    },
    McitMeaningPipe
  ]
})
export class McitFilterTpzcContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  groupForm: UntypedFormGroup;

  waitingThirdParty = false;
  waitingPlaces = false;
  waitingCountry = false;
  waitingZone = false;
  waitingCP = false;
  waitingCity = false;
  waitingState = false;

  thirdParties: { id: string; name: string; description: string }[];
  thirdParty: { id: string; name: string };
  thirdPartiesList: { id: string; name: string }[] = [];

  thirdPartyOperator: ThirdPartyOperator;
  placeOperator: ThirdPartyOperator;
  cityOperator: ThirdPartyOperator;
  zipOperator: ThirdPartyOperator;
  countryOperator: ThirdPartyOperator;
  stateOperator: ThirdPartyOperator;
  zoneOperator: ThirdPartyOperator;

  places: { id: string; name: string; description: string }[];
  place: { id: string; name: string };
  placesList: { id: string; name: string }[] = [];

  countries: { code: string; names: IMeaning }[];
  country: { code: string; name: string };
  countryList: { code: string; name: string }[] = [];

  zones: { id: string; name: string }[];
  zone: { id: string; name: string };
  zoneList: { id: string; name: string }[] = [];

  stateList: { state: string }[] = [];
  zipList: { zip: string }[] = [];
  citiesList: { city: string }[] = [];

  checkbox?: string;
  checkboxChecked?: boolean;

  private default: ITpzcFilterModel;

  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_FILTER_CUSTOM_KEY) public key: string,
    @Inject(MCIT_FILTER_CUSTOM_FILTER_CONFIG) public filterConfig: ITpzcContainer,
    @Inject(MCIT_FILTER_CUSTOM_INITIAL_FILTER) @Optional() public initialFilter: any,
    private formBuilder: UntypedFormBuilder,
    private placesHttpService: PlacesHttpService,
    private countriesHttpService: McitCountriesHttpService,
    private meaningPipe: McitMeaningPipe,
    private geoZoneHttpService: GeoZoneHttpService
  ) {
    if (this.filterConfig?.custom?.data?.params?.checkbox) {
      this.checkbox = this.filterConfig?.custom?.data?.params?.checkbox;
    }
    this.groupForm = this.formBuilder.group({
      third_party: [null],
      third_place_operator: ThirdPartyOperator.IN,
      place: [null],
      place_operator: ThirdPartyOperator.IN,
      zip: [''],
      zip_operator: ThirdPartyOperator.IN,
      city: [''],
      city_operator: ThirdPartyOperator.IN,
      country: [null],
      country_operator: ThirdPartyOperator.IN,
      zone: [null],
      zone_operator: ThirdPartyOperator.IN,
      state: [null],
      state_operator: ThirdPartyOperator.IN,
      checkboxChecked: null
    });
  }

  ngOnInit(): void {
    const value = lodash.defaultsDeep({}, this.initialFilter ? this.initialFilter : null, this.default);
    const current = {};
    this.mappingExistingFilter(value);
    current['third_party'] = null;
    current['zip'] = null;
    current['place'] = null;
    current['city'] = null;
    current['country'] = null;
    current['zone'] = null;
    current['state'] = null;
    current['checkboxChecked'] = null;
    current['third_place_operator'] = this.thirdPartyOperator;
    current['place_operator'] = this.placeOperator;
    current['city_operator'] = this.cityOperator;
    current['zip_operator'] = this.zipOperator;
    current['country_operator'] = this.countryOperator;
    current['state_operator'] = this.stateOperator;
    current['zone_operator'] = this.zoneOperator;

    this.groupForm.setValue(current);

    this.subscriptions.push(
      this.groupForm
        .get('third_party')
        .valueChanges.pipe(
          debounceTime(300),
          tap(() => (this.waitingThirdParty = true)),
          switchMap((v) => (v ? (this.filterConfig.custom.data.autocomplete(v, 5) as Observable<{ id: string; name: string; description: string }[]>) : of([] as { id: string; name: string; description: string }[]))),
          tap(() => (this.waitingThirdParty = false))
        )
        .subscribe((next) => {
          this.thirdParties = next;
        })
    );

    this.subscriptions.push(
      this.groupForm
        .get('place')
        .valueChanges.pipe(
          debounceTime(300),
          tap(() => (this.waitingPlaces = true)),
          switchMap((v) =>
            v
              ? this.placesHttpService.autocomplete(v, null).pipe(
                  map((res) =>
                    res.map((r) => ({
                      id: r.place_id,
                      name: r.name,
                      description: lodash.get(r.structured_formatting, 'secondary_text')
                    }))
                  ),
                  catchError((err) => {
                    console.error(err);
                    return of(null);
                  })
                )
              : of([])
          ),
          tap(() => (this.waitingPlaces = false))
        )
        .subscribe((next) => {
          this.places = next;
        })
    );

    this.subscriptions.push(
      this.groupForm
        .get('country')
        .valueChanges.pipe(
          debounceTime(300),
          tap(() => (this.waitingCountry = true)),
          switchMap((v) =>
            v
              ? this.countriesHttpService.search(v, 1, 5, 'code', 'code,names').pipe(
                  map((res) => res.body),
                  map((res) =>
                    res.map((r) => ({
                      code: r.code,
                      names: r.names
                    }))
                  ),
                  catchError((err) => {
                    console.error(err);
                    return of(null);
                  })
                )
              : of([])
          ),
          tap(() => (this.waitingCountry = false))
        )
        .subscribe((next) => {
          this.countries = next;
        })
    );

    this.subscriptions.push(
      this.groupForm
        .get('zone')
        .valueChanges.pipe(
          debounceTime(300),
          tap(() => (this.waitingZone = true)),
          switchMap((v) =>
            v
              ? this.geoZoneHttpService.autocompleteFillContextId(v, this.filterConfig.custom.data.contextId, 'code,name').pipe(
                  map((res) =>
                    res.map((r) => ({
                      id: r._id,
                      name: r.name
                    }))
                  ),
                  catchError((err) => {
                    console.error(err);
                    return of(null);
                  })
                )
              : of([])
          ),
          tap(() => (this.waitingZone = false))
        )
        .subscribe((next) => {
          console.log(next);
          this.zones = next;
        })
    );

    this.subscriptions.push(
      this.groupForm.get('third_place_operator').valueChanges.subscribe((value) => {
        if (this.thirdPartyOperator !== value) {
          this.thirdPartyOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.get('place_operator').valueChanges.subscribe((value) => {
        if (this.placeOperator !== value) {
          this.placeOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.get('city_operator').valueChanges.subscribe((value) => {
        if (this.cityOperator !== value) {
          this.cityOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.get('zip_operator').valueChanges.subscribe((value) => {
        if (this.zipOperator !== value) {
          this.zipOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.get('country_operator').valueChanges.subscribe((value) => {
        if (this.countryOperator !== value) {
          this.countryOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.get('state_operator').valueChanges.subscribe((value) => {
        if (this.stateOperator !== value) {
          this.stateOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );

    this.subscriptions.push(
      this.groupForm.get('zone_operator').valueChanges.subscribe((value) => {
        if (this.zoneOperator !== value) {
          this.zoneOperator = value;
          this.propagateChangeTPZC();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private mappingExistingFilter(value: ITpzcFilterModel): void {
    if (value?.third_party) {
      if (lodash.isArray(value.third_party)) {
        this.thirdPartiesList = lodash.cloneDeep(value?.third_party);
      } else {
        this.thirdPartiesList = [];
        this.thirdPartiesList.push(value?.third_party);
      }
    } else {
      this.thirdPartiesList = [];
    }
    if (value?.place) {
      if (lodash.isArray(value.place)) {
        this.placesList = lodash.cloneDeep(value?.place);
      } else {
        this.placesList = [];
        this.placesList.push(value?.place);
      }
    } else {
      this.placesList = [];
    }
    if (value?.zip) {
      if (lodash.isArray(value.zip)) {
        this.zipList = lodash.cloneDeep(value?.zip);
      } else {
        this.zipList = [];
        this.zipList.push(value?.zip);
      }
    } else {
      this.zipList = [];
    }
    if (value?.city) {
      if (lodash.isArray(value.city)) {
        this.citiesList = lodash.cloneDeep(value?.city);
      } else {
        this.citiesList = [];
        this.citiesList.push(value?.city);
      }
    } else {
      this.citiesList = [];
    }
    if (value?.country) {
      if (lodash.isArray(value.country)) {
        this.countryList = lodash.cloneDeep(value?.country);
      } else {
        this.countryList = [];
        this.countryList.push(value?.country);
      }
    } else {
      this.countryList = [];
    }
    if (value?.zone) {
      if (lodash.isArray(value.zone)) {
        this.zoneList = lodash.cloneDeep(value?.zone);
      } else {
        this.zoneList = [];
        this.zoneList.push(value?.zone);
      }
    } else {
      this.zoneList = [];
    }
    if (value?.state) {
      if (lodash.isArray(value.state)) {
        this.stateList = lodash.cloneDeep(value?.state);
      } else {
        this.stateList = [];
        this.stateList.push(value?.state);
      }
    } else {
      this.stateList = [];
    }
    if (value?.checkboxChecked != null) {
      this.checkboxChecked = value?.checkboxChecked;
    } else {
      this.checkboxChecked = null;
    }
    if (value?.third_party_operator) {
      this.thirdPartyOperator = value.third_party_operator;
    } else {
      this.thirdPartyOperator = ThirdPartyOperator.IN;
    }
    if (value?.place_operator) {
      this.placeOperator = value.place_operator;
    } else {
      this.placeOperator = ThirdPartyOperator.IN;
    }
    if (value?.city_operator) {
      this.cityOperator = value.city_operator;
    } else {
      this.cityOperator = ThirdPartyOperator.IN;
    }
    if (value?.zip_operator) {
      this.zipOperator = value.zip_operator;
    } else {
      this.zipOperator = ThirdPartyOperator.IN;
    }
    if (value?.country_operator) {
      this.countryOperator = value.country_operator;
    } else {
      this.countryOperator = ThirdPartyOperator.IN;
    }
    if (value?.state_operator) {
      this.stateOperator = value.state_operator;
    } else {
      this.stateOperator = ThirdPartyOperator.IN;
    }
    if (value?.zone_operator) {
      this.zoneOperator = value.zone_operator;
    } else {
      this.zoneOperator = ThirdPartyOperator.IN;
    }
  }

  writeValue(value: any) {
    const v = value ? lodash.cloneDeep(value) : null;
    const res: any = {};
    this.mappingExistingFilter(v);
    res['third_party'] = null;
    res['place'] = null;
    res['zip'] = null;
    res['city'] = null;
    res['country'] = null;
    res['zone'] = null;
    res['state'] = null;
    res['checkboxChecked'] = null;
    res['third_place_operator'] = this.thirdPartyOperator;
    res['place_operator'] = this.placeOperator;
    res['city_operator'] = this.cityOperator;
    res['zip_operator'] = this.zipOperator;
    res['country_operator'] = this.countryOperator;
    res['state_operator'] = this.stateOperator;
    res['zone_operator'] = this.zoneOperator;

    this.groupForm.setValue(lodash.defaultsDeep({}, res, this.default));
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}

  doClear(formControlName: string): void {
    this.groupForm.get(formControlName).setValue(null);
    if (formControlName === 'third_party') {
      this.thirdParties = null;
    } else if (formControlName === 'place') {
      this.places = null;
    } else if (formControlName === 'country') {
      this.countries = null;
    } else if (formControlName === 'zone') {
      this.zones = null;
    } else if (formControlName === 'checkboxChecked') {
      this.checkboxChecked = null;
    }
  }

  doThirdPartySelected(event): void {
    this.thirdParty = lodash.pick(event, ['id', 'name']);
    this.thirdPartiesList.push(this.thirdParty);
    this.groupForm.get('third_party').setValue(null);
    this.thirdParties = null;

    this.propagateChangeTPZC();
  }

  doPlaceSelected(event): void {
    this.place = lodash.pick(event, ['id', 'name']);
    this.placesList.push(this.place);
    this.groupForm.get('place').setValue(null);
    this.places = null;

    this.propagateChangeTPZC();
  }

  doCheckboxChecked(): void {
    this.propagateChangeTPZC();
  }

  doCountrySelected(event): void {
    this.country = {
      code: event.code,
      name: this.meaningPipe.transform(event.names)
    };
    this.countryList.push(this.country);
    this.groupForm.get('country').setValue(null);
    this.countries = null;

    this.propagateChangeTPZC();
  }

  doZoneSelected(event): void {
    this.zone = {
      id: event.id,
      name: event.name
    };
    this.zoneList.push(this.zone);
    this.groupForm.get('zone').setValue(null);
    this.zones = null;

    this.propagateChangeTPZC();
  }

  onKeyCP(event: KeyboardEvent): void {
    if (this.groupForm.get('zip').value !== '' && this.groupForm.get('zip').value !== null) {
      event.preventDefault();
      this.zipList.push({ zip: this.groupForm.get('zip').value });
      this.groupForm.get('zip').setValue(null);
      this.propagateChangeTPZC();
    }
  }

  onKeyCity(event: KeyboardEvent): void {
    if (this.groupForm.get('city').value !== '' && this.groupForm.get('city').value !== null) {
      event.preventDefault();
      this.citiesList.push({ city: this.groupForm.get('city').value });
      this.groupForm.get('city').setValue(null);
      this.propagateChangeTPZC();
    }
  }

  onKeyState(event: KeyboardEvent): void {
    if (this.groupForm.get('state').value !== '' && this.groupForm.get('state').value !== null) {
      event.preventDefault();
      this.stateList.push({ state: this.groupForm.get('state').value });
      this.groupForm.get('state').setValue(null);
      this.propagateChangeTPZC();
    }
  }

  doRemove(list, index): void {
    list.splice(index, 1);
    this.propagateChangeTPZC();
  }

  doClearList(list): void {
    list.splice(0, list.length);
    this.propagateChangeTPZC();
  }

  private propagateChangeTPZC(): void {
    if (
      this.thirdPartiesList.length > 0 ||
      this.placesList.length > 0 ||
      this.countryList.length > 0 ||
      this.zipList.length > 0 ||
      this.citiesList.length > 0 ||
      this.zoneList.length > 0 ||
      this.stateList.length > 0 ||
      this.checkboxChecked
    ) {
      if (this.checkbox && this.checkboxChecked) {
        this.propagateChange({
          checkboxChecked: this.checkboxChecked
        });
      } else {
        this.propagateChange({
          third_party: this.thirdPartiesList,
          third_party_operator: this.thirdPartyOperator,
          place: this.placesList,
          place_operator: this.placeOperator,
          country: this.countryList,
          country_operator: this.countryOperator,
          zip: this.zipList,
          zip_operator: this.zipOperator,
          city: this.citiesList,
          city_operator: this.cityOperator,
          zone: this.zoneList,
          zone_operator: this.zoneOperator,
          state: this.stateList,
          state_operator: this.stateOperator
        });
      }
    } else {
      this.propagateChange(null);
    }
  }
}
