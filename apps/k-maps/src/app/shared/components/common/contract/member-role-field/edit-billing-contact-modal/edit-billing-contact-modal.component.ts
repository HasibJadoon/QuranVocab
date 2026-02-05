import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { McitMeaningPipe } from '@lib-shared/common/common/pipes/meaning.pipe';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { TranslateService } from '@ngx-translate/core';
import { LANGUAGES } from '@lib-shared/common/models/language';
import { IBillingContact } from '@lib-shared/common/third-party/third-party.model';

@Component({
  selector: 'mcit-edit-billing-contact-modal',
  templateUrl: './edit-billing-contact-modal.component.html',
  styleUrls: ['./edit-billing-contact-modal.component.scss']
})
export class EditBillingContactModalComponent implements OnInit {
  data: { billingContact: IBillingContact; isDisabled: boolean } = {
    billingContact: null,
    isDisabled: false
  };

  billingContactForm: UntypedFormGroup;
  languages = LANGUAGES;
  submitAttempt = false;

  private place: any;
  private country: any;

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    private modalData: {
      billingContact: any;
      isDisabled: boolean;
    },
    private dialogRef: McitDialogRef<EditBillingContactModalComponent>,
    private meaningPipe: McitMeaningPipe,
    private formBuilder: UntypedFormBuilder,
    private translateService: TranslateService
  ) {
    this.data = Object.assign(this.data, modalData);

    this.billingContactForm = this.formBuilder.group({
      address: [{ value: false, disabled: this.data.isDisabled }],
      address_info: this.formBuilder.group({
        _place: [{ value: '', disabled: this.data.isDisabled }],
        address1: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        address2: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        address3: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        zip: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        city: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        _country: [{ value: '', disabled: this.data.isDisabled }]
      }),
      contact: [{ value: false, disabled: this.data.isDisabled }],
      contact_info: this.formBuilder.group({
        name: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        phone: [{ value: '', disabled: this.data.isDisabled }, Validators.maxLength(256)],
        email: [{ value: '', disabled: this.data.isDisabled }, Validators.email],
        language: [{ value: this.translateService.currentLang, disabled: this.data.isDisabled }, Validators.maxLength(256)]
      })
    });
  }

  ngOnInit(): void {
    const billingContact: any = this.modalData.billingContact;
    if (billingContact) {
      this.billingContactForm.patchValue({
        address: billingContact.address,
        address_info: {
          _place: billingContact.address_info?.place_name,
          address1: billingContact.address_info?.address1,
          address2: billingContact.address_info?.address2,
          address3: billingContact.address_info?.address3,
          zip: billingContact.address_info?.zip,
          city: billingContact.address_info?.city,
          _country: billingContact.address_info?.country ? billingContact.address_info?.country.name : null
        },
        contact: billingContact.contact,
        contact_info: {
          name: billingContact.contact_info?.name,
          phone: billingContact.contact_info?.phone,
          email: billingContact.contact_info?.email,
          language: billingContact.contact_info?.language ?? this.translateService.currentLang
        }
      });

      if (billingContact.address_info?.place_name) {
        this.disableAddressFields();
      }
    }
  }

  doPlaceChange(place: any): void {
    if (place) {
      this.place = { place_id: place.place_id, name: place.description };

      this.billingContactForm.patchValue(
        {
          address_info: {
            address1: place.address.addr1,
            address2: place.address.addr2,
            address3: '',
            zip: place.address.zip,
            city: place.address.city,
            _country: place.address.country.name
          }
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

      this.billingContactForm.get('address_info.address1').enable({ emitEvent: false });
      this.billingContactForm.get('address_info.address2').enable({ emitEvent: false });
      this.billingContactForm.get('address_info.address3').enable({ emitEvent: false });
      this.billingContactForm.get('address_info.zip').enable({ emitEvent: false });
      this.billingContactForm.get('address_info.city').enable({ emitEvent: false });
      this.billingContactForm.get('address_info._country').enable({ emitEvent: false });
    }

    this.billingContactForm.updateValueAndValidity();
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

  doClose(): void {
    this.dialogRef.close();
  }

  doSave(): void {
    this.submitAttempt = true;

    if (!this.billingContactForm.valid) {
      return;
    }

    const raw = this.billingContactForm.getRawValue();
    const billingContact = {
      address: this.modalData.billingContact?.address ?? false,
      address_info: {
        place_id: this.place ? this.place.place_id : '',
        place_name: this.place ? this.place.name : '',
        address1: raw.address_info?.address1,
        address2: raw.address_info?.address2,
        address3: raw.address_info?.address3,
        zip: raw.address_info?.zip,
        city: raw.address_info?.city,
        country: this.country
      },
      contact: this.modalData.billingContact?.contact ?? false,
      contact_info: {
        name: raw.contact_info?.name,
        phone: raw.contact_info?.phone,
        email: raw.contact_info?.email,
        language: raw.contact_info?.language ?? this.translateService.currentLang
      }
    };
    this.dialogRef.close(billingContact);
  }

  private disableAddressFields(): void {
    this.billingContactForm.get('address_info.address1').disable({ emitEvent: false });
    this.billingContactForm.get('address_info.address2').disable({ emitEvent: false });
    this.billingContactForm.get('address_info.address3').disable({ emitEvent: false });
    this.billingContactForm.get('address_info.zip').disable({ emitEvent: false });
    this.billingContactForm.get('address_info.city').disable({ emitEvent: false });
    this.billingContactForm.get('address_info._country').disable({ emitEvent: false });
  }

  public clearAddress(value: boolean): void {
    if (value) {
      this.billingContactForm.get('address_info').reset();
      this.billingContactForm.get('address_info').enable();
    }
  }

  public clearContact(value: boolean): void {
    if (value) {
      this.billingContactForm.get('contact_info').reset();
    }
  }

  public disableSaveButton(): boolean {
    if (this.billingContactForm.controls['address'].value) {
      const raw = this.billingContactForm.getRawValue();
      return !(raw.address_info?.address1 && raw.address_info?.zip && raw.address_info?.city && raw.address_info?._country);
    }
    return false;
  }
}
