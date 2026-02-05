import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '../common/common.module';
import { McitFormsModule } from '../forms/forms.module';
import { McitViewThirdPartyModalComponent } from './view-third-party-modal.component';
import { UiSwitchModule } from 'ngx-ui-switch';
import { McitTagsInputModule } from '../tags-input/tags-input.module';
import { TagPipe } from './pipes/tag.pipe';
import { ViewCarrierSoftwareModalComponent } from './widgets/view-carrier-software-modal/view-carrier-software-modal.component';
import { ViewLegalEntityModalComponent } from './widgets/view-legal-entity-modal/view-legal-entity-modal.component';
import { ViewParkModalComponent } from './widgets/view-park-modal/view-park-modal.component';
import { ViewStockAccountModalComponent } from './widgets/view-stock-account-modal/view-stock-account-modal.component';
import { HasRolePipe } from './pipes/has-role.pipe';
import { McitPhoneFieldModule } from '../phone-field/phone-field.module';
import { McitEditTranscodingModalModule } from '../edit-transcoding-modal/edit-transcoding-modal.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, FormsModule, McitFormsModule, ReactiveFormsModule, UiSwitchModule, McitTagsInputModule, McitPhoneFieldModule, McitEditTranscodingModalModule],
  declarations: [McitViewThirdPartyModalComponent, ViewCarrierSoftwareModalComponent, ViewLegalEntityModalComponent, ViewParkModalComponent, ViewStockAccountModalComponent, TagPipe, HasRolePipe],
  exports: [McitViewThirdPartyModalComponent]
})
export class McitViewThirdPartyModalModule {}
