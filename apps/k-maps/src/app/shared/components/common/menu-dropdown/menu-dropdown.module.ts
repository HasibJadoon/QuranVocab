import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitMenuDropdownComponent } from './menu-dropdown.component';
import { McitMenuDropdownService } from './menu-dropdown.service';
import { McitDropdownModule } from '../dropdown/dropdown.module';
import { McitCommonModule } from '../common/common.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitDropdownModule, McitCommonModule],
  declarations: [McitMenuDropdownComponent],
  providers: [McitMenuDropdownService]
})
export class McitMenuDropdownModule {}
