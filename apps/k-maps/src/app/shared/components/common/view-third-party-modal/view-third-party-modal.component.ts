import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../dialog/dialog-ref';
import { MCIT_DIALOG_DATA, McitDialog } from '../dialog/dialog.service';
import { LANGUAGES } from '../models/language';
import { McitPopupService } from '../services/popup.service';
import { ViewCarrierSoftwareModalComponent } from './widgets/view-carrier-software-modal/view-carrier-software-modal.component';
import { ViewLegalEntityModalComponent } from './widgets/view-legal-entity-modal/view-legal-entity-modal.component';
import { ViewParkModalComponent } from './widgets/view-park-modal/view-park-modal.component';
import { ViewStockAccountModalComponent } from './widgets/view-stock-account-modal/view-stock-account-modal.component';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { McitWaitingService } from '../services/waiting.service';
import * as lodash from 'lodash';
import { McitEditTranscodingModalService } from '../edit-transcoding-modal/edit-transcoding-modal.service';
import { IThirdParty } from '../third-party/third-party.model';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'mcit-view-third-party-modal',
  templateUrl: './view-third-party-modal.component.html',
  styleUrls: ['./view-third-party-modal.component.scss']
})
export class McitViewThirdPartyModalComponent implements OnInit {
  thirdParty: any;
  contactLanguage = '';
  isMoveecarEntity: boolean;
  isGEFCOEntity: boolean;
  isInternalExternalFieldNeeded: boolean;
  isAssociatedLegalEntityFieldNeeded: boolean;
  isAgencyCodeFieldNeeded: boolean;
  isClusterCodeFieldNeeded: boolean;
  isCustomerTagsFieldNeeded: boolean;
  isPartiallyEditable = false;
  isTranscodingEditable = false;
  autocompleteCodification: (s) => Observable<HttpResponse<any[]>>;
  languages = LANGUAGES;
  form = this.fb.group({
    contact_name_edit: [''],
    contact_phone_edit: [''],
    contact_email_edit: ['', Validators.email],
    contact_language_edit: [this.translateService.currentLang],
    role_pickup: [null],
    role_delivery: [null],
    transcoding: [[]]
  });
  thirdPartiesHttpService;

  constructor(
    private dialogRef: McitDialogRef<McitViewThirdPartyModalComponent, IThirdParty>,
    @Inject(MCIT_DIALOG_DATA)
    private data: {
      thirdParty: any;
      isPartiallyEditable: boolean;
      isTranscodingEditable: boolean;
      thirdPartiesHttpService: any;
      autocompleteCodification: (s) => Observable<HttpResponse<any[]>>;
    },
    private dialog: McitDialog,
    private popupService: McitPopupService,
    private fb: FormBuilder,
    private translateService: TranslateService,
    private waitingService: McitWaitingService,
    private editTranscodingModalService: McitEditTranscodingModalService
  ) {
    this.thirdParty = data.thirdParty;
    this.isPartiallyEditable = data.isPartiallyEditable;
    this.isTranscodingEditable = data.isTranscodingEditable;
    this.thirdPartiesHttpService = data.thirdPartiesHttpService;
    this.autocompleteCodification = data.autocompleteCodification;

    if (this.thirdParty.contacts[0]?.language && LANGUAGES.find((l) => l.code === this.thirdParty.contacts[0]?.language)) {
      const language = LANGUAGES.find((l) => l.code === this.thirdParty.contacts[0]?.language);
      this.contactLanguage = language.name;
    }
    if (!this.isPartiallyEditable) {
      this.form.disable();
    } else {
      this.form.setValue({
        contact_name_edit: this.thirdParty?.contacts?.[0]?.name ?? '',
        contact_phone_edit: this.thirdParty?.contacts?.[0]?.phone ?? '',
        contact_email_edit: this.thirdParty?.contacts?.[0]?.email ?? '',
        contact_language_edit: this.thirdParty?.contacts?.[0]?.language ?? this.translateService.currentLang,
        role_pickup: !!this.thirdParty?.roles?.find((r) => r === 'PICKUP'),
        role_delivery: !!this.thirdParty?.roles?.find((r) => r === 'DELIVERY'),
        transcoding: this.thirdParty.transcoding ?? []
      });
    }

    this.form.get('transcoding').setValue(this.thirdParty.transcoding ?? []);

    this.isMoveecarEntity = this.thirdParty.entities && this.thirdParty.entities.includes('MOVEECAR');
    this.isGEFCOEntity = this.thirdParty.entities && this.thirdParty.entities.includes('GEFCO');
    this.isInternalExternalFieldNeeded =
      this.thirdParty.roles &&
      (this.thirdParty.roles.includes('CHARTER') ||
        this.thirdParty.roles.includes('CARRIER') ||
        this.thirdParty.roles.includes('BILLED') ||
        this.thirdParty.roles.includes('BRANCH') ||
        this.thirdParty.roles.includes('MRE') ||
        this.thirdParty.roles.includes('LEGAL_ENTITY') ||
        this.thirdParty.roles.includes('PARK'));
    this.isAssociatedLegalEntityFieldNeeded =
      this.thirdParty.roles &&
      !this.thirdParty.roles.includes('LEGAL_ENTITY') &&
      (this.thirdParty.roles.includes('CHARTER') || this.thirdParty.roles.includes('CARRIER') || this.thirdParty.roles.includes('BILLED') || this.thirdParty.roles.includes('MRE'));
    this.isAgencyCodeFieldNeeded =
      this.thirdParty.roles &&
      (this.thirdParty.roles.includes('CHARTER') ||
        this.thirdParty.roles.includes('CARRIER') ||
        this.thirdParty.roles.includes('BILLED') ||
        this.thirdParty.roles.includes('BRANCH') ||
        this.thirdParty.roles.includes('MRE') ||
        this.thirdParty.roles.includes('PARK'));
    this.isClusterCodeFieldNeeded = this.thirdParty.roles && this.thirdParty.roles.includes('LEGAL_ENTITY');
    this.isCustomerTagsFieldNeeded = this.thirdParty.roles && (this.thirdParty.roles.includes('PRINCIPAL') || this.thirdParty.roles.includes('BILLED'));
  }

  ngOnInit(): void {}

  doEditTranscodings(readOnly: boolean): void {
    this.editTranscodingModalService.open(this.form.get('transcoding').value, readOnly, this.autocompleteCodification).subscribe((result) => {
      if (!readOnly && result) {
        this.form.get('transcoding').setValue(result);
      }
    });
  }

  doViewtRoleDetails(role: string) {
    switch (role) {
      case 'CARRIER':
        this.dialog.open(ViewCarrierSoftwareModalComponent, {
          dialogClass: 'modal-sm',
          data: this.thirdParty.carrier_software
        });
        break;
      case 'LEGAL_ENTITY':
        this.dialog.open(ViewLegalEntityModalComponent, {
          dialogClass: 'modal-lg',
          data: this.thirdParty.legal_entity
        });
        break;
      case 'STOCK_ACCOUNT':
        this.dialog.open(ViewStockAccountModalComponent, {
          dialogClass: 'modal-lg',
          data: {
            platform: this.thirdParty.stock_account?.platform?.name,
            principal: this.thirdParty.stock_account?.principal?.name
          }
        });
        break;
      case 'PARK':
        this.dialog.open(ViewParkModalComponent, {
          dialogClass: 'modal-lg',
          data: {
            park: this.thirdParty.park,
            intern: this.thirdParty.intern,
            agency: this.thirdParty.agency
          }
        });
        break;
      default:
        this.popupService.showError();
        break;
    }
  }

  goBack(): void {
    this.dialogRef.close();
  }

  doSave(): any {
    if (this.form.invalid) {
      return;
    }
    if (!this.thirdPartiesHttpService) {
      this.waitingService.hideWaiting();
      this.popupService.showError();
    }

    this.waitingService.showWaiting();
    const form = this.form.getRawValue();
    const thirdParty: IThirdParty = lodash.cloneDeep(this.thirdParty);

    if (this.isPartiallyEditable) {
      const roles = lodash.compact([...this.thirdParty.roles.filter((r) => r !== 'PICKUP').filter((r) => r !== 'DELIVERY'), form?.role_pickup ? 'PICKUP' : undefined, form?.role_delivery ? 'DELIVERY' : undefined]);
      const contact = {
        name: form.contact_name_edit,
        phone: form.contact_phone_edit,
        email: form.contact_email_edit,
        language: form.contact_language_edit
      };

      lodash.set(thirdParty, 'roles', roles);
      lodash.set(thirdParty, 'contacts[0]', contact);
      lodash.set(thirdParty, 'transcoding', form.transcoding ?? []);
    }
    if (this.isTranscodingEditable) {
      thirdParty.transcoding = form.transcoding ?? [];
    }

    this.thirdPartiesHttpService.update(thirdParty).subscribe(
      (next) => {
        this.waitingService.hideWaiting();
        this.popupService.showSuccess('THIRD_PARTY_MODAL.EDIT_SUCCESS', { messageParams: { name: thirdParty.name } });
        this.dialogRef.close(thirdParty);
      },
      (err) => {
        this.waitingService.hideWaiting();
        this.popupService.showError();
      }
    );
  }
}
