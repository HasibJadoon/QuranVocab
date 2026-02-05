import { NgModule } from '@angular/core';
import { EditBillingContactModalService } from './edit-billing-contact-modal.service';
import { EditBillingContactModalComponent } from './edit-billing-contact-modal.component';
import { CommonModule } from '@angular/common';
import { McitDialogModule } from '@lib-shared/common/dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { UiSwitchModule } from 'ngx-ui-switch';
import { McitPlaceFieldModule } from '@lib-shared/common/place-field/place-field.module';
import { McitCountryFieldModule } from '@lib-shared/common/country-field/country-field.module';
import { McitPhoneFieldModule } from '@lib-shared/common/phone-field/phone-field.module';
import { McitMeaningPipe } from '@lib-shared/common/common/pipes/meaning.pipe';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, McitCommonModule, McitDialogModule, McitFormsModule, TypeaheadModule, UiSwitchModule, McitPlaceFieldModule, McitCountryFieldModule, McitPhoneFieldModule],
  declarations: [EditBillingContactModalComponent],
  providers: [EditBillingContactModalService, McitMeaningPipe]
})
export class EditBillingContactModalModule {}
