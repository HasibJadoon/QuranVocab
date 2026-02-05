import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitChooseCountryPhoneModalComponent } from './choose-country-phone-modal.component';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitChooseCountryPhoneModalService } from './choose-country-phone-modal.service';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '../common/common.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitCommonModule, FormsModule],
  declarations: [McitChooseCountryPhoneModalComponent],
  providers: [McitChooseCountryPhoneModalService]
})
export class McitChooseCountryPhoneModalModule {}
