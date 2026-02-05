import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitChooseCountryModalService } from './choose-country-modal.service';
import { McitChooseCountryModalComponent } from './choose-country-modal.component';
import { McitCommonModule } from '../common/common.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDialogModule, McitCommonModule, FormsModule],
  declarations: [McitChooseCountryModalComponent],
  providers: [McitChooseCountryModalService]
})
export class McitChooseCountryModalModule {}
