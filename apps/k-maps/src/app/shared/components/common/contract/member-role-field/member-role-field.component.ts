import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { AddressesHttpService } from '@lib-shared/common/contract/services/addresses-http.service';
import { ThirdPartiesHttpService } from '@lib-shared/common/contract/services/third-parties-http.service';
import { McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { IMemberRole, ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { McitListSearchService } from '@lib-shared/common/search/list-search/list-search.service';
import { McitQuestionModalService } from '@lib-shared/common/question-modal/question-modal.service';
import { McitInfoModalService } from '@lib-shared/common/info-modal/info-modal.service';
import { PlacesHttpService } from '@lib-shared/common/services/places-http.service';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { ThirdPartyRole } from '@lib-shared/common/third-party/third-party-role.domain';
import { TranslateService } from '@ngx-translate/core';
import * as lodash from 'lodash';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EditMemberRoleModalComponent } from './edit-member-role-modal/edit-member-role-modal.component';

export interface IOptions {
  useThirdParty?: boolean;
  usePlace?: boolean;
  useCarrierAddress?: boolean;
  editable?: boolean;
  favorites$?: Observable<IMemberRole[]>;
  useSubscriptions?: boolean;
  apiRoute?: DispatcherApiRoutesEnum;
  service?: string;
  defaultSubscriptions?: ISubscriptionMemberRole[];
  save?: {
    id: string;
    history?: boolean;
    favorite?: boolean;
    showMode?: 'auto' | 'dropdown' | 'modal';
    showImportExportSettings?: boolean;
  };
  filters?: {
    showMode?: 'auto' | 'dropdown' | 'modal' | 'inline';
    dropdownMinWidth?: string;
    showFiltersBottom?: boolean;

    hideSearch?: boolean;
    resetOnClear?: boolean;
  };
  size?: 'small' | 'normal' | 'large';
  condensed?: boolean;
  showInfoText?: boolean;
  infoTextKey?: string;
  forceBorder?: boolean;
  enableListSearch?: boolean;
}

@Component({
  selector: 'mcit-member-role-field',
  templateUrl: './member-role-field.component.html',
  styleUrls: ['./member-role-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemberRoleFieldComponent),
      multi: true
    }
  ]
})
export class MemberRoleFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private _required = false;

  @Input() placeholder: string;
  @Input() submitAttempt: boolean;
  @Input() isDisabled = false;
  @Input() textArea = false;

  @Input()
  set required(_required: boolean) {
    this._required = _required;

    if (this.memberRoleFieldForm) {
      this.memberRoleFieldForm.get('memberRole').setValidators(Validators.compose(lodash.compact([this.validateMemberRole(), _required ? Validators.required : null])));
    }
  }

  get required(): boolean {
    return this._required;
  }

  filters: {};
  searchBox: string;

  @Input() isLocked: boolean;
  @Input() role: string;
  @Input() priority_role: string;
  @Input() options: IOptions = {
    useThirdParty: false,
    usePlace: false,
    useCarrierAddress: false,
    editable: false,
    favorites$: null,
    useSubscriptions: false,
    apiRoute: null,
    service: null,
    defaultSubscriptions: null,
    save: null,
    filters: null,
    size: 'normal',
    condensed: false,
    showInfoText: true,
    infoTextKey: null,
    forceBorder: false,
    enableListSearch: false
  };

  @Output() memberRoleEvent = new EventEmitter<IMemberRole>();
  @Output() memberRolesEvent = new EventEmitter<IMemberRole[]>();

  @Input() parentForm: UntypedFormGroup;

  memberRoleFieldForm: UntypedFormGroup;

  memberRoleDataSource: Observable<any>;
  memberRoleLoading = false;

  private memberRole: IMemberRole;
  private propagateChange: (_: any) => any;
  private subscriptions: Subscription[] = [];

  billing_calendar: '';
  payment_term = '';

  constructor(
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService,
    private addressesHttpService: AddressesHttpService,
    private placesHttpService: PlacesHttpService,
    private dialog: McitDialog,
    private translateService: TranslateService,
    private thirdPartiesHttpService: ThirdPartiesHttpService,
    private questionModalService: McitQuestionModalService,
    private infoModalService: McitInfoModalService,
    private listSearchService: McitListSearchService
  ) {}

  ngOnInit(): void {
    this.memberRoleFieldForm = this.formBuilder.group({
      memberRole: [
        {
          value: '',
          disabled: this.isDisabled || this.isLocked
        },
        Validators.compose(lodash.compact([this.validateMemberRole(), this.required ? Validators.required : null]))
      ]
    });
    this.memberRoleDataSource = new Observable((observer: any) => {
      observer.next(this.memberRoleFieldForm.controls['memberRole'].value);
    }).pipe(switchMap((token: string) => this.getAutocompleteQuery$(token)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
  }

  doShowTextArea(listButton: any): void {
    this.listSearchService.showList(listButton, this.options, this.searchBox, false).subscribe((t) => {
      this.searchBox = t.text;
      this.updateChange();
    });
  }

  private updateChange(): void {
    const memberRoles: IMemberRole[] = [];
    this.propagateChange({
      text: this.searchBox,
      filters: this.filters
    });
    this.thirdPartiesHttpService.autocomplete(this.searchBox, 100, {}, '').subscribe(
      (thirdParties) => {
        const searchBoxValues = this.searchBox.split('||').map((value) => value.trim());

        const alreadyAddedPrincipals = this.parentForm.value?.principal_customers?.map((value: IMemberRole) => value?.gefco_code);

        const duplicatesInSearchBox = searchBoxValues.filter((item, index) => searchBoxValues.indexOf(item) !== index);
        const duplicates = [...new Set(duplicatesInSearchBox), ...alreadyAddedPrincipals.filter((p) => searchBoxValues.includes(p))];

        const uniqueSearchBoxValues = [...new Set(searchBoxValues)];

        const filteredThirdParties = thirdParties.filter((thirdParty) => uniqueSearchBoxValues.includes(thirdParty.gefco_code) && !alreadyAddedPrincipals.includes(thirdParty.gefco_code));
        filteredThirdParties.forEach((thirdParty) => {
          const contact = lodash.head(thirdParty.contacts);

          const isLegalEntity = thirdParty.roles.includes(ThirdPartyRole.LEGAL_ENTITY);
          this.memberRole = {
            third_party_id: thirdParty._id,
            gefco_code: thirdParty.gefco_code,
            code: thirdParty.code,
            transcoding: thirdParty.transcoding,
            name: thirdParty.name,
            place_id: thirdParty.place_id,
            place_name: thirdParty.place_name,
            address1: thirdParty.address1,
            address2: thirdParty.address2,
            address3: thirdParty.address3,
            zip: thirdParty.zip,
            city: thirdParty.city,
            country: thirdParty.country,
            contact: contact
              ? {
                  name: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  language: contact.language
                }
              : null,
            obtpop: thirdParty.obtpop,
            obplatform: thirdParty.obplatform,
            obcenter: thirdParty.obcenter,
            associated_legal_entity_id: isLegalEntity ? thirdParty._id : thirdParty.associated_legal_entity ? thirdParty.associated_legal_entity._id : null,
            subscriptions: this.memberRole?.subscriptions || this.options?.defaultSubscriptions || [],
            billing_contact: thirdParty.billing_contact,
            geoposition: thirdParty.geoposition,
            area: thirdParty.area,
            timezone: thirdParty.timezone
          };
          memberRoles.push(this.memberRole);
        });
        this.memberRoleFieldForm.controls['memberRole'].updateValueAndValidity();

        this.propagateChange(memberRoles);

        this.memberRolesEvent.emit(memberRoles);

        let missingPrincipals = [];
        let errorTitle = '';
        let errorMessage = '';

        if (uniqueSearchBoxValues.length === filteredThirdParties.length && duplicates.length === 0) {
          this.infoModalService.showInfo('MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.SUCCESS', 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.SUCCESS_MESSAGE');
        } else {
          missingPrincipals = uniqueSearchBoxValues.filter(
            (principal) =>
              !thirdParties.some((thirdParty) => {
                const isGefcoCode = /^\d+(\.\d+)?$/.test(principal);
                return isGefcoCode ? thirdParty.gefco_code === principal : thirdParty.code?.toLowerCase() === principal.toLowerCase();
              })
          );

          if (duplicates.length > 0 && missingPrincipals.length > 0) {
            errorTitle = 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.DUPLICATES_AND_MISSING';
            errorMessage = 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.DUPLICATES_AND_MISSING_MESSAGE';
          } else if (duplicates.length > 0) {
            errorTitle = 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.DUPLICATES';
            errorMessage = 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.DUPLICATES_MESSAGE';
          } else {
            errorTitle = 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.PARTIAL_SUCCESS';
            errorMessage = 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.PARTIAL_SUCCESS_MESSAGE';
          }

          this.infoModalService.showInfo(
            errorTitle,
            errorMessage,
            undefined,
            {
              principals: [...new Set(missingPrincipals)].join(' <br> '),
              duplicates: [...new Set(duplicates)].join(' <br> ')
            },
            {},
            null,
            { renderMessageAsHtml: true }
          );
        }
      },
      (error) => {
        this.infoModalService.showInfo('MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.ERROR', 'MEMBER_ROLE_FIELD.MASS_PRINCIPAL_OPTIONS.ERROR_MESSAGE');
      }
    );
  }

  private validateMemberRole(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (!c.value || this.memberRole) {
        return null;
      }
      return { memberRole: true };
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
                memberRole: item
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
    return this.thirdPartiesHttpService
      .autocompleteSingle(
        input,
        5,
        lodash.omitBy(
          {
            role
          },
          lodash.isNil
        ),
        'code,name,address1,address2,address3,zip,city,country.name,gefco_code',
        this.options?.apiRoute
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
    return this.thirdPartiesHttpService
      .autocompleteSingle(
        input,
        5,
        lodash.omitBy(
          {
            excluded_role: this.priority_role,
            role: this.role
          },
          lodash.isNil
        ),
        'code,name,address1,address2,address3,zip,city,country.name,gefco_code,associated_legal_entity',
        this.options?.apiRoute
      )
      .pipe(
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

  getMemberRoleErrorMessage(): string {
    const c = this.memberRoleFieldForm.controls['memberRole'];
    if (c.hasError('required')) {
      return 'COMMON.FIELD_IS_MANDATORY';
    } else if (c.hasError('memberRole')) {
      return 'MEMBER_ROLE_FIELD.MEMBER_ROLE_IS_WRONG';
    }
    return null;
  }

  /**
   * Chargement en cours de la recherche des lieux
   */
  doChangeMemberRoleLoading(event: boolean): void {
    this.memberRoleLoading = event;
  }

  /**
   * Un lieu a été selectionné
   */
  doAddressSelected(event: any): void {
    const item = event.item;
    if (item.type === 'FAVORITES') {
      this.loadFavorites(item);
    } else if (item.type === 'ADDRESSES') {
      this.loadAddress(item._id);
    } else if (item.type === 'PLACES') {
      this.loadPlace(item.place_id);
    } else if (item.type === 'THIRD_PARTIES') {
      this.loadThirdParty(item._id);
    }
  }

  private loadFavorites(favorite: any): void {
    if (this.memberRole?.subscriptions?.length > 0) {
      this.questionModalService
        .showQuestion('MEMBER_ROLE_FIELD.SUBSCRIPTIONS_QUESTION_TITLE', 'MEMBER_ROLE_FIELD.SUBSCRIPTIONS_QUESTION', 'COMMON.YES', 'COMMON.NO', false, {
          questionParams: {
            old: this.memberRole.subscriptions.length,
            new: favorite?.memberRole?.subscriptions?.length
          }
        })
        .subscribe((next) => {
          this._loadFavorites(favorite, !next);
        });
    } else {
      this._loadFavorites(favorite, false);
    }
  }

  private _loadFavorites(favorite: any, copySubscriptions: boolean): void {
    const mr = lodash.cloneDeep(favorite.memberRole);
    if (copySubscriptions) {
      mr.subscriptions = this.memberRole?.subscriptions || [];
    }
    this.memberRole = mr;
    this.memberRoleFieldForm.controls['memberRole'].updateValueAndValidity();

    this.propagateChange(this.memberRole);

    this.memberRoleEvent.emit(this.memberRole);
  }

  private loadAddress(addressId: string): void {
    this.memberRoleLoading = true;

    this.addressesHttpService.get(addressId).subscribe(
      (next) => {
        this.memberRoleLoading = false;

        this.memberRole = {
          name: next.name,
          place_id: next.place_id,
          place_name: next.place_name,
          address1: next.address1,
          address2: next.address2,
          address3: next.address3,
          zip: next.zip,
          city: next.city,
          country: next.country,
          timezone: null,
          geoposition: null,
          area: null,
          contact: next.contact
            ? {
                name: next.contact.name,
                email: next.contact.email,
                phone: next.contact.phone,
                language: next.contact.language
              }
            : null,
          subscriptions: this.memberRole?.subscriptions || this.options?.defaultSubscriptions || []
        };

        this.memberRoleFieldForm.controls['memberRole'].updateValueAndValidity();

        this.propagateChange(this.memberRole);

        this.memberRoleEvent.emit(this.memberRole);
      },
      (err) => {
        this.memberRoleLoading = false;

        this.popupService.showError();
      }
    );
  }

  private loadPlace(placeId: string): void {
    this.memberRoleLoading = true;

    this.placesHttpService.detail(placeId).subscribe(
      (next) => {
        this.memberRoleLoading = false;

        this.memberRole = {
          name: next.name,
          place_id: next.place_id,
          place_name: next.formatted_address,
          address1: next.address.addr1,
          address2: next.address.addr2,
          address3: '',
          zip: next.address.zip,
          city: next.address.city,
          country: next.address.country,
          contact: null,
          subscriptions: this.memberRole?.subscriptions || this.options?.defaultSubscriptions || [],
          timezone: next.timezone,
          geoposition: next.location
            ? {
                latitude: next.location.lat,
                longitude: next.location.lng,
                geo: {
                  type: 'Point',
                  coordinates: [next.location.lng, next.location.lat]
                }
              }
            : null,
          area: null
        };

        this.memberRoleFieldForm.controls['memberRole'].updateValueAndValidity();

        this.propagateChange(this.memberRole);

        this.memberRoleEvent.emit(this.memberRole);
      },
      (err) => {
        this.memberRoleLoading = false;

        this.popupService.showError();
      }
    );
  }

  private loadThirdParty(thirdPartyId: string): void {
    this.memberRoleLoading = true;

    this.thirdPartiesHttpService.get(thirdPartyId).subscribe(
      (next) => {
        this.memberRoleLoading = false;

        const contact = lodash.head(next.contacts);

        const isLegalEntity = next.roles.includes(ThirdPartyRole.LEGAL_ENTITY);

        this.memberRole = {
          third_party_id: thirdPartyId,
          gefco_code: next.gefco_code,
          code: next.code,
          transcoding: next.transcoding,
          name: next.name,
          place_id: next.place_id,
          place_name: next.place_name,
          address1: next.address1,
          address2: next.address2,
          address3: next.address3,
          zip: next.zip,
          city: next.city,
          country: next.country,
          contact: contact
            ? {
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                language: contact.language
              }
            : null,
          obtpop: next.obtpop,
          obplatform: next.obplatform,
          obcenter: next.obcenter,
          associated_legal_entity_id: isLegalEntity ? thirdPartyId : next.associated_legal_entity ? next.associated_legal_entity._id : null,
          subscriptions: this.memberRole?.subscriptions || this.options?.defaultSubscriptions || [],
          billing_contact: next.billing_contact,
          geoposition: next.geoposition,
          area: next.area,
          timezone: next.timezone
        };

        this.memberRoleFieldForm.controls['memberRole'].updateValueAndValidity();

        this.propagateChange(this.memberRole);

        this.memberRoleEvent.emit(this.memberRole);
      },
      (err) => {
        this.memberRoleLoading = false;

        this.popupService.showError();
      }
    );
  }

  /**
   * Efface la valeur
   */
  doClearMemberRole(): void {
    this.memberRoleFieldForm.controls['memberRole'].setValue(null);
    this.memberRole = null;

    this.propagateChange(null);

    this.memberRoleEvent.emit(null);
  }

  /**
   * Editer le member role
   */
  doEditMemberRole(): void {
    const dialogRef = this.dialog.open(EditMemberRoleModalComponent, {
      dialogClass: 'modal-lg',
      data: {
        memberRole: this.memberRole,
        role: this.role ? this.role : this.priority_role,
        service: lodash.get(this.options, 'service', lodash.get(this.options, 'apiRoute', null)),
        useCarrierAddress: lodash.get(this.options, 'useCarrierAddress', false),
        useSubscriptions: lodash.get(this.options, 'useSubscriptions', false),
        apiRoute: lodash.get(this.options, 'apiRoute', null),
        isDisabled: this.isDisabled
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.memberRole = result;
        this.memberRoleFieldForm.controls['memberRole'].setValue(this.memberRole.name);

        this.propagateChange(this.memberRole);

        this.memberRoleEvent.emit(this.memberRole);
      }
    });
  }

  writeValue(value: any): void {
    if (value) {
      this.memberRole = value;
      this.memberRoleFieldForm.controls['memberRole'].setValue(value.name, { emitEvent: false });
    } else {
      this.memberRole = null;
      this.memberRoleFieldForm.controls['memberRole'].setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {
    if (!this.isLocked) {
      if (isDisabled) {
        this.memberRoleFieldForm.controls['memberRole'].disable({ emitEvent: false });
      } else {
        this.memberRoleFieldForm.controls['memberRole'].enable({ emitEvent: false });
      }
    }
  }

  showTooltip(): boolean {
    const text = this.getTooltipString();
    return this.memberRole && text && text.length > 0;
  }

  getTooltipString(): string {
    if (this.memberRole) {
      const country_name = lodash.get(this.memberRole, 'country.name');
      if (this.memberRole.address1 && !this.memberRole.address2 && !this.memberRole.address3 && this.memberRole.city && this.memberRole.address1 === this.memberRole.city) {
        // Place de type ville, on évite les doublons
        return [this.memberRole.city, this.memberRole.zip, country_name].filter((o) => o && o.length > 0).join(', ');
      } else if (this.memberRole.address1 && !this.memberRole.address2 && !this.memberRole.address3 && !this.memberRole.city && country_name && this.memberRole.address1 === country_name) {
        // Place de type pays, on évite les doublons
        return country_name;
      } else {
        // autre
        return [this.memberRole.address1, this.memberRole.address2, this.memberRole.address3, this.memberRole.city, this.memberRole.zip, country_name].filter((o) => o && o.length > 0).join(', ');
      }
    }
    return '';
  }
}
