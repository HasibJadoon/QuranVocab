import { NgModule } from '@angular/core';
import { SearchAddressModalService } from './search-address-modal.service';
import { SearchAddressModalComponent } from './search-address-modal.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { McitDialogModule } from '@lib-shared/common/dialog/dialog.module';
import { McitCommonModule } from '@lib-shared/common/common/common.module';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, McitCommonModule, McitDialogModule],
  declarations: [SearchAddressModalComponent],
  providers: [SearchAddressModalService]
})
export class SearchAddressModalModule {}
