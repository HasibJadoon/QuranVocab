import { ChangeDetectorRef, Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup, NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as lodash from 'lodash';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { EditMemberRoleModalComponent } from '../edit-member-role-modal/edit-member-role-modal.component';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { PlacesHttpService } from '@lib-shared/common/services/places-http.service';
import { IThirdParty } from '@lib-shared/common/third-party/third-party.model';
import { IMemberRole } from '@lib-shared/common/models/member-role.model';
import { ThirdPartiesHttpService } from '@lib-shared/common/contract/services/third-parties-http.service';
import { AddressesHttpService } from '@lib-shared/common/contract/services/addresses-http.service';

export interface IOptions {
  useThirdParty?: boolean;
  usePlace?: boolean;
  useCarrierAddress?: boolean;
  editable?: boolean;
  favorites$?: Observable<IMemberRole[]>;
}

@Component({
  selector: 'mcit-third-party-field',
  templateUrl: './third-party-field.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ThirdPartyFieldComponent),
      multi: true
    }
  ]
})
export class ThirdPartyFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;

  @Input() placeholder: string;
  @Input() submitAttempt: boolean;

  @Input()
  set required(_required: boolean) {
    this._required = _required;
    this.thirdPartyFieldForm.get('thirdParty').setValidators(Validators.compose(lodash.compact([this.validateThirdParty(), _required ? Validators.required : null])));
  }
  get required(): boolean {
    return this._required;
  }

  @Input() role: string;
  @Input() priority_role: string;
  @Input() options: IOptions = {
    useThirdParty: false,
    usePlace: false,
    useCarrierAddress: false,
    editable: false,
    favorites$: null
  };

  @Output() thirdPartyEvent = new EventEmitter<IThirdParty>();

  thirdPartyFieldForm: UntypedFormGroup;
  thirdPartyDataSource: Observable<any>;
  thirdPartyLoading = false;

  private thirdParty: IThirdParty;
  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService,
    private dialog: McitDialog,
    private translateService: TranslateService,
    private addressesHttpService: AddressesHttpService,
    private thirdPartyService: ThirdPartiesHttpService,
    private placesHttpService: PlacesHttpService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.thirdPartyFieldForm = this.formBuilder.group({
      thirdParty: ['', Validators.compose(lodash.compact([this.validateThirdParty(), this.required ? Validators.required : null]))]
    });
  }

  ngOnInit(): void {
    this.thirdPartyDataSource = new Observable((observer: any) => {
      observer.next(this.thirdPartyFieldForm.controls['thirdParty'].value);
    }).pipe(switchMap((token: string) => this.getAutocompleteQuery$(token)));

    this.thirdPartyFieldForm = this.formBuilder.group({
      thirdParty: ['', Validators.compose(lodash.compact([this.validateThirdParty(), this.required ? Validators.required : null]))]
    });
    this.subscriptions.push(this.thirdPartyFieldForm.valueChanges.pipe(distinctUntilChanged()).subscribe((c) => this.changeDetectorRef.markForCheck()));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  private validateThirdParty(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (!c.value || this.thirdParty) {
        return null;
      }
      return { thirdParty: true };
    };
  }

  private getAutocompleteQuery$(input: string): Observable<any> {
    const array = [];

    if (lodash.get(this.options, 'favorites$')) {
      const regexp = new RegExp(`${lodash.escapeRegExp(lodash.deburr(input))}`, 'i');

      array.push(
        this.options.favorites$.pipe(
          map((items) =>
            items
              .filter((item) => !input || lodash.deburr(item.name).match(regexp))
              .map((item) => ({
                type: 'FAVORITES',
                typeTitle: this.translateService.instant('MEMBER_ROLE_FIELD.FAVORITES'),
                name: item.name,
                thirdParty: item
              }))
          ),
          catchError((err, cause) => {
            this.popupService.showError();
            return of([]);
          })
        )
      );
    }

    if (input && lodash.get(this.options, 'useCarrierAddress', false)) {
      array.push(
        this.addressesHttpService
          .search(
            input,
            1,
            5,
            lodash.omitBy(
              {
                role: this.role
              },
              lodash.isNil
            ),
            'name',
            'name'
          )
          .pipe(
            map((resp) => {
              const total = Number(resp.headers.get('X-Total'));
              return resp.body.map((item) => ({
                type: 'ADDRESSES',
                typeTitle: this.translateService.instant('MEMBER_ROLE_FIELD.ADDRESSES', { total }),
                ...item
              }));
            }),
            catchError((err, cause) => {
              this.popupService.showError();
              return of([]);
            })
          )
      );
    }

    if (input && lodash.get(this.options, 'useThirdParty', false)) {
      if (this.priority_role) {
        this.priority_role.split(',').forEach((role) => {
          array.push(this.getThirdPartyWithPriorityRole(input, role));
        });
      }
      array.push(this.getOtherThirdParties(input));
    }

    if (input && lodash.get(this.options, 'usePlace', false)) {
      array.push(
        this.placesHttpService.autocomplete(input, null).pipe(
          map((items) =>
            items.map((item) => ({
              type: 'PLACES',
              typeTitle: this.translateService.instant('MEMBER_ROLE_FIELD.PLACES'),
              ...item
            }))
          ),
          catchError((err, cause) => {
            this.popupService.showError();
            return of([]);
          })
        )
      );
    }

    return forkJoin(array).pipe(map((rs) => rs.reduce((acc, x) => lodash.concat(acc, x), [])));
  }

  getThirdPartyWithPriorityRole(input: string, role: string): Observable<any> {
    const mapping = {};
    return this.thirdPartyService
      .searchThirdParties(
        input,
        5,
        lodash.omitBy(
          {
            role
          },
          lodash.isNil
        ),
        'code,name,address1,address2,address3,zip,city,country.name,gefco_code'
      )
      .pipe(
        map((body) =>
          body.map((item) => ({
            type: 'THIRD_PARTIES',
            typeTitle: this.translateService.instant(`MEMBER_ROLE_FIELD.PRIORITY_ROLE_TITLE.${role}`),
            ...item
          }))
        ),
        map((favorites) => favorites.filter((favorite) => (mapping[favorite.name] ? false : (mapping[favorite.name] = true)))),
        catchError((err, cause) => {
          this.popupService.showError();

          return of([]);
        })
      );
  }
  getOtherThirdParties(input: string): Observable<any> {
    const mapping = {};
    return this.thirdPartyService.searchThirdParties(input, 5, lodash.omitBy({ excluded_role: this.priority_role, role: this.role }, lodash.isNil), 'code,name,address1,address2,address3,zip,city,country.name,gefco_code').pipe(
      map((body) =>
        body.map((item) => ({
          type: 'THIRD_PARTIES',
          typeTitle: this.translateService.instant('MEMBER_ROLE_FIELD.THIRD_PARTIES'),
          ...item
        }))
      ),
      map((favorites) => favorites.filter((favorite) => (mapping[favorite.name] ? false : (mapping[favorite.name] = true)))),
      catchError((err, cause) => {
        this.popupService.showError();

        return of([]);
      })
    );
  }

  getThirdPartyErrorMessage(): string {
    const c = this.thirdPartyFieldForm.controls['thirdParty'];
    if (c.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    } else if (c.hasError('thirdParty')) {
      return 'MEMBER_ROLE_FIELD.MEMBER_ROLE_IS_WRONG';
    }
    return null;
  }

  /**
   * Chargement en cours de la recherche des lieux
   */
  doChangeThirdPartyLoading(event: boolean): void {
    this.thirdPartyLoading = event;
  }

  /**
   * Un lieu a été selectionné
   */
  doAddressSelected(event): void {
    const item = event.item;
    if (item.type === 'FAVORITES') {
      this.loadFavorites(item);
    } else if (item.type === 'THIRD_PARTIES') {
      this.loadThirdParty(item._id);
    }
  }

  private loadFavorites(favorite: any): void {
    this.thirdParty = lodash.cloneDeep(favorite.thirdParty);
    this.thirdPartyFieldForm.controls['thirdParty'].updateValueAndValidity();

    this.propagateChange(this.thirdParty);

    this.thirdPartyEvent.emit(this.thirdParty);
  }

  private loadThirdParty(thirdPartyId: string): void {
    this.thirdPartyLoading = true;

    this.thirdPartyService.get(thirdPartyId).subscribe(
      (next) => {
        this.thirdPartyLoading = false;
        this.thirdParty = next;
        this.thirdPartyFieldForm.controls['thirdParty'].updateValueAndValidity();
        this.propagateChange(next);
        this.thirdPartyEvent.emit(next);
      },
      (err) => {
        this.thirdPartyLoading = false;
        this.popupService.showError();
      }
    );
  }

  /**
   * Efface la valeur
   */
  doClearThirdParty(): void {
    this.thirdPartyFieldForm.controls['thirdParty'].setValue(null);
    this.thirdParty = null;

    this.propagateChange(null);

    this.thirdPartyEvent.emit(null);
  }

  /**
   * Editer le member role
   */
  doEditThirdParty(): void {
    const dialogRef = this.dialog.open(EditMemberRoleModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        thirdParty: this.thirdParty,
        role: this.role,
        useCarrierAddress: lodash.get(this.options, 'useCarrierAddress', false)
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.thirdParty = result;
        this.thirdPartyFieldForm.controls['thirdParty'].setValue(this.thirdParty.name);

        this.propagateChange(this.thirdParty);

        this.thirdPartyEvent.emit(this.thirdParty);
      }
    });
  }

  writeValue(value: any) {
    if (value) {
      this.thirdParty = value;
      this.thirdPartyFieldForm.controls['thirdParty'].setValue(value.name, { emitEvent: false });
    } else {
      this.thirdParty = null;
      this.thirdPartyFieldForm.controls['thirdParty'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.thirdPartyFieldForm.controls['thirdParty'].disable({ emitEvent: false });
    } else {
      this.thirdPartyFieldForm.controls['thirdParty'].enable({ emitEvent: false });
    }
  }

  showTooltip(): boolean {
    const text = this.getTooltipString();
    return this.thirdParty && text && text.length > 0;
  }

  getTooltipString(): string {
    if (this.thirdParty) {
      const country_name = lodash.get(this.thirdParty, 'country.name');
      if (this.thirdParty.address1 && !this.thirdParty.address2 && !this.thirdParty.address3 && this.thirdParty.city && this.thirdParty.address1 === this.thirdParty.city) {
        // Place de type ville, on évite les doublons
        return [this.thirdParty.city, this.thirdParty.zip, country_name].filter((o) => o && o.length > 0).join(', ');
      } else if (this.thirdParty.address1 && !this.thirdParty.address2 && !this.thirdParty.address3 && !this.thirdParty.city && country_name && this.thirdParty.address1 === country_name) {
        // Place de type pays, on évite les doublons
        return country_name;
      } else {
        // autre
        return [this.thirdParty.address1, this.thirdParty.address2, this.thirdParty.address3, this.thirdParty.city, this.thirdParty.zip, country_name].filter((o) => o && o.length > 0).join(', ');
      }
    }
    return '';
  }
}
