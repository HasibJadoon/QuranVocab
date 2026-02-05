import { NgModule } from '@angular/core';
import { McitGroupComponent } from './group.component';
import { CommonModule } from '@angular/common';
import { McitDropdownModule } from '@lib-shared/common/dropdown/dropdown.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitCommonModule } from '@lib-shared/common/common/common.module';

@NgModule({
  imports: [CommonModule, McitDropdownModule, TranslateModule, McitCommonModule],
  exports: [McitGroupComponent],
  declarations: [McitGroupComponent]
})
export class McitGroupModule {}
