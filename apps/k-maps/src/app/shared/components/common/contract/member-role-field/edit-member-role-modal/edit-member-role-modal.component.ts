import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA, McitDialog } from '@lib-shared/common/dialog/dialog.service';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { Observable, combineLatest, of } from 'rxjs';
import * as lodash from 'lodash';
import { McitMeaningPipe } from '@lib-shared/common/common/pipes/meaning.pipe';
import { LANGUAGES } from '@lib-shared/common/models/language';
import { TranslateService } from '@ngx-translate/core';
import { McitMenuDropdownService } from '@lib-shared/common/menu-dropdown/menu-dropdown.service';
import { McitQuestionModalService } from '@lib-shared/common/question-modal/question-modal.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import { IThirdParty } from '@lib-shared/common/third-party/third-party.model';
import { EditBillingContactModalService } from '../edit-billing-contact-modal/edit-billing-contact-modal.service';
import { filter } from 'rxjs/operators';
import { timeZonesNames } from '@vvo/tzdb';
import { McitEditGeopositionMapModalService } from '@lib-shared/common/edit-geoposition-map-modal/edit-geoposition-map-modal.service';
import { McitEditPolygonMapModalService } from '@lib-shared/common/edit-polygon-map-modal/edit-polygon-map-modal.service';
import { IMemberRole, ISubscriptionMemberRole } from '@lib-shared/common/models/member-role.model';
import { AddressRole } from '@lib-shared/common/models/address.model';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { SearchAddressModalService } from '@lib-shared/common/contract/member-role-field/search-address-modal/search-address-modal.service';
import { AddressesHttpService } from '@lib-shared/common/contract/services/addresses-http.service';
import { ThirdPartiesHttpService } from '@lib-shared/common/contract/services/third-parties-http.service';
import { EditSubscriptionModalService } from '@lib-shared/common/contract/add-edit-modals/edit-subscription-modal/edit-subscription-modal.service';

@Component({
  selector: 'mcit-edit-member-role-modal',
  templateUrl: './edit-member-role-modal.component.html',
  styleUrls: ['./edit-member-role-modal.component.scss'],
  providers: [McitMeaningPipe]
})
export class EditMemberRoleModalComponent implements OnInit {
  timezones = timeZonesNames;

  DEROGATORY_ROLES = [AddressRole.BILLED, AddressRole.PRINCIPAL];

  memberRoleForm: UntypedFormGroup;
  submitAttempt = false;
  editedMemberRole: IMemberRole;
  languages = LANGUAGES;
  role: string;
  useCarrierAddress: boolean;
  requiredFields: boolean;
  isDisabled: boolean;
  useSubscriptions: boolean;
  allowDerogatory: boolean;
  public displayLegalEntity: boolean;
  public composedAssociatedLegalEntity: string;

  private place: any;
  private country: any;
  private apiRoute: DispatcherApiRoutesEnum;
  private service: string;
  private thirdParty: IThirdParty;
  private withPushNotifications = false;

  private fieldValidators: { [key: string]: ValidatorFn } = {
    address1: Validators.compose([Validators.maxLength(256)]),
    zip: Validators.compose([Validators.maxLength(256)]),
    city: Validators.compose([Validators.maxLength(256)]),
    _country: Validators.compose([])
  };

  private thirdPartyData: Observable<IThirdParty[]> = combineLatest([this.getThirdParty(), this.getThirdPartyForAssociateLegalEntity()]);

  constructor(
    private dialogRef: McitDialogRef<EditMemberRoleModalComponent>,
    @Inject(MCIT_DIALOG_DATA)
    private data: {
      memberRole: IMemberRole;
      displayLegalEntity: boolean;
      role: string;
      service: string;
      useCarrierAddress: boolean;
      isDisabled: boolean;
      useSubscriptions: boolean;
      apiRoute: DispatcherApiRoutesEnum;
      withPushNotifications?: boolean;
    },
    private formBuilder: UntypedFormBuilder,
    private popupService: McitPopupService,
    private meaningPipe: McitMeaningPipe,
    private translateService: TranslateService,
    private menuDropdownService: McitMenuDropdownService,
    private addressesHttpService: AddressesHttpService,
    private searchAddressModalService: SearchAddressModalService,
    private questionModalService: McitQuestionModalService,
    private thirdPartiesHttpService: ThirdPartiesHttpService,
    private waitingService: McitWaitingService,
    private dialog: McitDialog,
    private editBillingContactModalService: EditBillingContactModalService,
    private editSubscriptionModalService: EditSubscriptionModalService,
    private editGeopositionMapModalService: McitEditGeopositionMapModalService,
    private editPolygonMapModalService: McitEditPolygonMapModalService
  ) {
    this.role = data.role;
    this.service = data.service;
    this.useCarrierAddress = data.useCarrierAddress;
    this.useSubscriptions = data.useSubscriptions;
    this.apiRoute = data.apiRoute;
    this.isDisabled = data.isDisabled;
    this.withPushNotifications = data.withPushNotifications;
    this.displayLegalEntity = this.data.displayLegalEntity;

    this.memberRoleForm = this.formBuilder.group({
      check_derogatory_main_infos: [{ value: false, disabled: this.isDisabled }],
      associated_legal_entity: [{ value: '', disabled: this.isDisabled }],
      code: [{ value: '', disabled: true }],
      name: [
        {
          value: '',
          disabled: this.isDisabled
        },
        Validators.compose([Validators.minLength(1), Validators.maxLength(256), Validators.required])
      ],
      _place: [{ value: '', disabled: this.isDisabled }],
      address1: [{ value: '', disabled: this.isDisabled }],
      address2: [{ value: '', disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])],
      address3: [{ value: '', disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])],
      zip: [{ value: '', disabled: this.isDisabled }],
      city: [{ value: '', disabled: this.isDisabled }],
      _country: [{ value: '', disabled: this.isDisabled }],
      geoposition: [null],
      area: [null],
      timezone: [''],
      contact: this.formBuilder.group({
        name: [{ value: '', disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])],
        phone: [{ value: '', disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])],
        email: [{ value: '', disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])],
        language: [{ value: this.translateService.currentLang, disabled: this.isDisabled }, Validators.compose([Validators.maxLength(256)])]
      }),
      subscriptions: [[]],
      billing_contact: [null]
    });
  }

  ngOnInit(): void {
    const memberRole = this.data.memberRole;
    this.allowDerogatory = memberRole?.third_party_id && this.DEROGATORY_ROLES.includes(this.role as AddressRole);

    this.initThirdPartyValues(memberRole);

    this.requiredFields = true;
    if (memberRole) {
      this.editedMemberRole = memberRole;
      this.memberRoleForm.patchValue({
        check_derogatory_main_infos: memberRole.check_derogatory_main_infos,
        name: memberRole?.name,
        _place: memberRole.place_name,
        address1: memberRole.address1,
        address2: memberRole.address2,
        address3: memberRole.address3,
        zip: memberRole.zip,
        city: memberRole.city,
        _country: memberRole.country ? memberRole.country.name : '',
        timezone: memberRole.timezone,
        geoposition: memberRole.geoposition,
        area: memberRole.area,
        contact: {
          name: memberRole.contact ? memberRole.contact.name : '',
          phone: memberRole.contact ? memberRole.contact.phone : '',
          email: memberRole.contact ? memberRole.contact.email : '',
          language: memberRole.contact ? memberRole.contact.language : ''
        },
        subscriptions: memberRole.subscriptions,
        billing_contact: memberRole.billing_contact
      });

      if (([AddressRole.BILLED, AddressRole.PRINCIPAL].includes(this.role as AddressRole) && memberRole.check_derogatory_main_infos) || [AddressRole.PICKUP, AddressRole.DELIVERY].includes(this.role as AddressRole)) {
        this.memberRoleForm.controls['name'].enable({ emitEvent: false });
        this.memberRoleForm.controls['_place'].enable({ emitEvent: false });
        this.memberRoleForm.controls['contact'].enable({ emitEvent: false });
      } else {
        this.memberRoleForm.controls['name'].disable({ emitEvent: false });
        this.memberRoleForm.controls['_place'].disable({ emitEvent: false });
        this.memberRoleForm.controls['contact'].disable({ emitEvent: false });
        this.disableAddressFields();
      }

      if (memberRole.place_id) {
        this.place = { place_id: memberRole.place_id, name: memberRole.place_name };

        this.disableAddressFields();
        this.memberRoleForm.updateValueAndValidity();
      }
      if (memberRole.country != null) {
        this.country = memberRole.country;
      }
      if (memberRole.third_party_id != null) {
        this.requiredFields = false;
      }
    }

    Object.keys(this.fieldValidators).forEach((k) => {
      this.memberRoleForm.get(k).setValidators(this.requiredFields ? Validators.compose([this.fieldValidators[k], Validators.required]) : this.fieldValidators[k]);
    });
  }

  private initThirdPartyValues(memberRole: IMemberRole): void {
    this.thirdPartyData.subscribe(([thirdParty, associateLegalEntity]: IThirdParty[]) => {
      this.thirdParty = thirdParty ?? null;
      this.memberRoleForm.patchValue({
        code: (thirdParty?.code ?? memberRole.code ?? '') + ' ' + this.getNostraCode(thirdParty?.transcoding ?? memberRole.transcoding),
        associated_legal_entity: this.compoundAssociateLegalEntity(associateLegalEntity, memberRole)
      });
    });
  }

  dodisplayAssociatedLegalEntity(associatedLegalEntity: IThirdParty, memberRole: IMemberRole): string {
    return associatedLegalEntity?.code || this.hasLegalEntity() ? '(' + associatedLegalEntity?.code ?? memberRole.code + ')' : '';
  }

  hasLegalEntity(): boolean {
    return !!this.data.memberRole.legal_entity;
  }

  public compoundAssociateLegalEntity(associateLegalEntity: IThirdParty, memberRole: IMemberRole): string {
    let nameValue: string = associateLegalEntity?.name ?? (this.hasLegalEntity() ? memberRole.name : '');
    let definiteNameValue = nameValue.length > 23 ? nameValue.substring(0, 23) + ' ...' : nameValue;
    let codeValue: string = associateLegalEntity?.code || this.hasLegalEntity() ? '(' + (associateLegalEntity?.code ?? memberRole.code) + ')' : '';
    this.composedAssociatedLegalEntity = nameValue + ' ' + codeValue;

    return definiteNameValue + ' ' + codeValue;
  }

  private getThirdParty(): Observable<IThirdParty> {
    if (this.data.memberRole?.third_party_id) {
      return this.thirdPartiesHttpService.get(this.data.memberRole.third_party_id);
    } else {
      return of(null);
    }
  }

  private getThirdPartyForAssociateLegalEntity(): Observable<IThirdParty> {
    if (this.hasAssociatedLegalEntity()) {
      return this.thirdPartiesHttpService.get(this.data.memberRole.associated_legal_entity._id);
    } else {
      return of(null);
    }
  }

  public hasThirdPartyId(): boolean {
    return !!this.data.memberRole?.third_party_id;
  }

  public hasAssociatedLegalEntity(): boolean {
    return !!this.data.memberRole?.associated_legal_entity;
  }

  private getNostraCode(transcoding: { entity?: string; x_code?: string }[]): string {
    if (!transcoding) {
      return '';
    }
    const result = lodash.find(transcoding, { entity: 'GEFCO' });
    return result ? '(' + result.x_code + ')' : '';
  }

  doDerogatoryChange(value: boolean): void {
    if (value) {
      this.memberRoleForm.controls['name'].enable({ emitEvent: false });
      this.memberRoleForm.controls['_place'].enable({ emitEvent: false });
      this.memberRoleForm.controls['contact'].enable({ emitEvent: false });
    } else {
      this.resetMemberRole(this.thirdParty);

      this.memberRoleForm.controls['name'].disable({ emitEvent: false });
      this.memberRoleForm.controls['_place'].disable({ emitEvent: false });
      this.memberRoleForm.controls['contact'].disable({ emitEvent: false });
      this.disableAddressFields();
    }
  }

  private resetMemberRole(thirdParty: IThirdParty) {
    this.memberRoleForm.patchValue({
      code: (thirdParty.code ?? '') + ' ' + this.getNostraCode(thirdParty.transcoding),
      name: thirdParty.name,
      _place: thirdParty.place_name,
      address1: thirdParty.address1,
      address2: thirdParty.address2,
      address3: thirdParty.address3,
      zip: thirdParty.zip,
      city: thirdParty.city,
      _country: thirdParty.country ? thirdParty.country.name : '',
      timezone: thirdParty.timezone,
      geoposition: thirdParty.geoposition,
      area: thirdParty.area,
      contact: {
        name: thirdParty.contacts ? thirdParty.contacts[0].name : '',
        phone: thirdParty.contacts ? thirdParty.contacts[0].phone : '',
        email: thirdParty.contacts ? thirdParty.contacts[0].email : '',
        language: thirdParty.contacts ? thirdParty.contacts[0].language : ''
      },
      billing_contact: thirdParty.billing_contact ?? null
    });
  }

  doPlaceChange(place: any): void {
    if (place) {
      this.place = { place_id: place.place_id, name: place.description };

      console.log(place);

      this.memberRoleForm.patchValue(
        {
          address1: place.address.addr1,
          address2: place.address.addr2,
          address3: '',
          zip: place.address.zip,
          city: place.address.city,
          _country: place.address.country.name,
          timezone: place.timezone,
          geoposition: place.location
            ? {
                latitude: place.location.lat,
                longitude: place.location.lng,
                geo: {
                  type: 'Point',
                  coordinates: [place.location.lng, place.location.lat]
                }
              }
            : null,
          area: null
        },
        { emitEvent: false }
      );
      this.country = {
        code: place.address.country.code,
        name: place.address.country.name
      };

      this.disableAddressFields();
    } else {
      this.place = null;
      this.enableAddressFields();
    }

    this.memberRoleForm.updateValueAndValidity();
  }

  private enableAddressFields() {
    this.memberRoleForm.controls['address1'].enable({ emitEvent: false });
    this.memberRoleForm.controls['address2'].enable({ emitEvent: false });
    this.memberRoleForm.controls['address3'].enable({ emitEvent: false });
    this.memberRoleForm.controls['zip'].enable({ emitEvent: false });
    this.memberRoleForm.controls['city'].enable({ emitEvent: false });
    this.memberRoleForm.controls['_country'].enable({ emitEvent: false });
    this.memberRoleForm.controls['timezone'].enable({ emitEvent: false });
    this.memberRoleForm.controls['geoposition'].enable({ emitEvent: false });
    this.memberRoleForm.controls['area'].enable({ emitEvent: false });
  }

  private disableAddressFields() {
    this.memberRoleForm.controls['address1'].disable({ emitEvent: false });
    this.memberRoleForm.controls['address2'].disable({ emitEvent: false });
    this.memberRoleForm.controls['address3'].disable({ emitEvent: false });
    this.memberRoleForm.controls['zip'].disable({ emitEvent: false });
    this.memberRoleForm.controls['city'].disable({ emitEvent: false });
    this.memberRoleForm.controls['_country'].disable({ emitEvent: false });
    this.memberRoleForm.controls['timezone'].disable({ emitEvent: false });
    this.memberRoleForm.controls['geoposition'].disable({ emitEvent: false });

    if (this.editedMemberRole?.third_party_id != null) {
      this.memberRoleForm.controls['area'].disable({ emitEvent: false });
    }
  }

  doCountryChange(country: any): void {
    if (country) {
      this.country = {
        code: country.code,
        name: this.meaningPipe.transform(country.names)
      };
    } else {
      this.country = null;
    }
  }

  doSaveAddressMenu(saveButton): void {
    this.menuDropdownService
      .chooseOptions(saveButton, [
        { code: 'new', nameKey: 'MEMBER_ROLE_FIELD.MODAL.NEW' },
        { code: 'merge', nameKey: 'MEMBER_ROLE_FIELD.MODAL.MERGE', ellipse: true }
      ])
      .subscribe((key) => {
        if (key) {
          switch (key) {
            case 'new':
              this.doNewAddress();
              break;
            case 'merge':
              this.doMergeAddress();
              break;
          }
        }
      });
  }

  private doNewAddress(): void {
    const form = this.memberRoleForm.getRawValue();

    const address = {
      name: form.name,
      roles: [this.role as AddressRole],
      place_id: this.place ? this.place.place_id : '',
      place_name: form._place,
      address1: form.address1,
      address2: form.address2,
      address3: form.address3,
      zip: form.zip,
      city: form.city,
      country: this.country,
      contact: form.contact,
      timezone: form.timezone,
      geoposition: form.geoposition,
      area: form.area
    };

    this.waitingService.showWaiting();
    this.addressesHttpService.create(address).subscribe(
      (next) => {
        this.waitingService.hideWaiting();

        this.popupService.showSuccess('MEMBER_ROLE_FIELD.MODAL.ADDRESS_SAVED', {
          messageParams: {
            name: address.name
          }
        });
      },
      (err) => {
        this.waitingService.hideWaiting();

        this.popupService.showError();
      }
    );
  }

  private doMergeAddress(): void {
    this.searchAddressModalService.searchAddress().subscribe((a) => {
      this.questionModalService
        .showQuestion('MEMBER_ROLE_FIELD.MODAL.MERGE', 'MEMBER_ROLE_FIELD.MODAL.QUESTION_MERGE', 'MEMBER_ROLE_FIELD.MODAL.MERGE', 'COMMON.CANCEL', true, {
          questionParams: {
            name: a.name
          }
        })
        .subscribe((resp) => {
          if (resp) {
            this.waitingService.showWaiting();
            this.addressesHttpService.get(a._id).subscribe(
              (next1) => {
                const form = this.memberRoleForm.getRawValue();

                const address = {
                  _id: next1._id,
                  name: form.name,
                  roles: lodash.union([this.role as AddressRole], next1.roles),
                  place_id: this.place ? this.place.place_id : '',
                  place_name: form._place,
                  address1: form.address1,
                  address2: form.address2,
                  address3: form.address3,
                  zip: form.zip,
                  city: form.city,
                  country: this.country,
                  contact: form.contact,
                  timezone: form.timezone,
                  geoposition: form.geoposition,
                  area: form.area
                };

                this.addressesHttpService.update(address).subscribe(
                  (next) => {
                    this.waitingService.hideWaiting();

                    this.popupService.showSuccess('MEMBER_ROLE_FIELD.MODAL.ADDRESS_SAVED', {
                      messageParams: {
                        name: address.name
                      }
                    });
                  },
                  (err) => {
                    this.waitingService.hideWaiting();

                    this.popupService.showError();
                  }
                );
              },
              (err) => {
                this.waitingService.hideWaiting();

                this.popupService.showError();
              }
            );
          }
        });
    });
  }

  doValidate(): void {
    this.submitAttempt = true;

    if (!this.memberRoleForm.valid) {
      return;
    }

    const form = this.memberRoleForm.getRawValue();

    const obj = {
      check_derogatory_main_infos: form.check_derogatory_main_infos,
      name: form.name,
      place_id: this.place ? this.place.place_id : '',
      place_name: form._place,
      address1: form.address1,
      address2: form.address2,
      address3: form.address3,
      zip: form.zip,
      city: form.city,
      country: this.country,
      contact: form.contact,
      subscriptions: form.subscriptions,
      billing_contact: form.billing_contact,
      timezone: form.timezone,
      geoposition: form.geoposition,
      area: form.area
    };

    const updated = this.editedMemberRole ? lodash.assign({}, lodash.cloneDeep(this.editedMemberRole), obj) : obj;
    this.dialogRef.close(updated);
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doAddSubscription(): void {
    this.editSubscriptionModalService
      .editSubscription(null, {
        apiRoute: this.apiRoute,
        role: this.role ? this.role.toLowerCase() : null,
        service: this.service,
        third_party_id: lodash.get(this.editedMemberRole, 'third_party_id'),
        withPushNotifications: this.withPushNotifications ?? false
      })
      .subscribe((data) => {
        if (data) {
          const subscriptionsControl = this.memberRoleForm.get('subscriptions');
          let ss = subscriptionsControl.value as ISubscriptionMemberRole[];
          if (ss == null) {
            ss = [];
          }
          ss.push(data);
          subscriptionsControl.setValue(ss);
        }
      });
  }

  doEditSubscription(index: number, subscription: ISubscriptionMemberRole): void {
    this.editSubscriptionModalService
      .editSubscription(subscription, {
        apiRoute: this.apiRoute,
        role: this.role ? this.role.toLowerCase() : null,
        service: this.service,
        third_party_id: lodash.get(this.editedMemberRole, 'third_party_id'),
        withPushNotifications: this.withPushNotifications ?? false
      })
      .subscribe((data) => {
        if (data) {
          const subscriptionsControl = this.memberRoleForm.get('subscriptions');
          const ss = subscriptionsControl.value as ISubscriptionMemberRole[];
          ss[index] = data;
          subscriptionsControl.setValue(ss);
        }
      });
  }

  doDeleteSubscription(index: number): void {
    const subscriptionsControl = this.memberRoleForm.get('subscriptions');
    let ss = subscriptionsControl.value as ISubscriptionMemberRole[];
    ss = ss.filter((x, i) => i !== index);
    subscriptionsControl.setValue(ss);
  }

  allowBillingContact(): boolean {
    return this.role === AddressRole.BILLED;
  }

  doEditBillingContact(): void {
    const billingContact = this.memberRoleForm.get('billing_contact').value;
    const checkDerogatoryMainInfos = this.memberRoleForm.get('check_derogatory_main_infos').value;

    this.editBillingContactModalService.editBillingContact(billingContact, !checkDerogatoryMainInfos).subscribe((next) => {
      if (next) {
        this.memberRoleForm.get('billing_contact').setValue(next);
      }
    });
  }

  doEditGeoposition(): void {
    const geo = this.memberRoleForm.get('geoposition').value;
    this.editGeopositionMapModalService
      .editGeopositionMap(geo)
      .pipe(filter((res) => res != null))
      .subscribe((next) => {
        this.memberRoleForm.get('geoposition').setValue(next.geoposition);

        if (next.place != null) {
          if (!this.memberRoleForm.get('timezone').value) {
            this.memberRoleForm.get('timezone').setValue(next.place.timezone);
          }
        }
      });
  }

  doEditPolygon(): void {
    const geo = this.memberRoleForm.get('geoposition').value;
    const area = this.memberRoleForm.get('area').value;
    this.editPolygonMapModalService
      .editPolygonMap(geo, area)
      .pipe(filter((res) => res != null))
      .subscribe((next) => {
        this.memberRoleForm.get('area').setValue(next.area);
      });
  }
}
