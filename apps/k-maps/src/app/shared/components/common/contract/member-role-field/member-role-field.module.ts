import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { MemberRoleFieldComponent } from './member-role-field.component';
import { McitFormsModule } from '@lib-shared/common/forms/forms.module';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitPlaceFieldModule } from '@lib-shared/common/place-field/place-field.module';
import { McitDialogModule } from '@lib-shared/common/dialog/dialog.module';
import { EditMemberRoleModalComponent } from './edit-member-role-modal/edit-member-role-modal.component';
import { McitCountryFieldModule } from '@lib-shared/common/country-field/country-field.module';
import { GetHeaderMemberRolePipe } from './pipes/get-header-member-role.pipe';
import { McitPhoneFieldModule } from '@lib-shared/common/phone-field/phone-field.module';
import { McitMenuDropdownModule } from '@lib-shared/common/menu-dropdown/menu-dropdown.module';
import { McitQuestionModalModule } from '@lib-shared/common/question-modal/question-modal.module';
import { McitInfoModalModule } from '@lib-shared/common/info-modal/info-modal.module';
import { ThirdPartyFieldComponent } from './third-party-field/third-party-field.component';
import { McitTagsInputModule } from '@lib-shared/common/tags-input/tags-input.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { ToMapMemberRolePipe } from './pipes/to-map-member-role.pipe';
import { UiSwitchModule } from 'ngx-ui-switch';
import { McitEditPolygonMapModalModule } from '@lib-shared/common/edit-polygon-map-modal/edit-polygon-map-modal.module';
import { McitEditGeopositionMapModalModule } from '@lib-shared/common/edit-geoposition-map-modal/edit-geoposition-map-modal.module';
import { SearchAddressModalModule } from '@lib-shared/common/contract/member-role-field/search-address-modal/search-address-modal.module';
import { EditBillingContactModalModule } from '@lib-shared/common/contract/member-role-field/edit-billing-contact-modal/edit-billing-contact-modal.module';
import { EditSubscriptionModalModule } from '@lib-shared/common/contract/add-edit-modals/edit-subscription-modal/edit-subscription-modal.module';
import { ToMemberRolePipe } from '@lib-shared/common/contract/member-role-field/pipes/to-member-role.pipe';
import { GetGefcoTranscoPipe } from '@lib-shared/common/contract/member-role-field/pipes/get-gefco-transco.pipe';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    McitFormsModule,
    TypeaheadModule,
    McitCommonModule,
    McitPlaceFieldModule,
    McitDialogModule,
    McitCountryFieldModule,
    McitPhoneFieldModule,
    McitMenuDropdownModule,
    SearchAddressModalModule,
    McitQuestionModalModule,
    McitInfoModalModule,
    McitTooltipModule,
    McitTagsInputModule,
    UiSwitchModule,
    EditBillingContactModalModule,
    EditSubscriptionModalModule,
    McitEditGeopositionMapModalModule,
    McitEditPolygonMapModalModule
  ],
  declarations: [MemberRoleFieldComponent, ThirdPartyFieldComponent, EditMemberRoleModalComponent, GetHeaderMemberRolePipe, ToMapMemberRolePipe, GetGefcoTranscoPipe, ToMemberRolePipe],
  exports: [MemberRoleFieldComponent, ThirdPartyFieldComponent, GetGefcoTranscoPipe, ToMapMemberRolePipe, ToMemberRolePipe]
})
export class MemberRoleFieldModule {}
