import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { McitCommonModule } from '../common/common.module';
import { McitTagsInputComponent } from './tags-input.component';
import { McitDisplayAdditionalAttributsPipe } from './pipes/additional-attributes.pipe';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, McitCommonModule],
  declarations: [McitTagsInputComponent, McitDisplayAdditionalAttributsPipe],
  exports: [McitTagsInputComponent]
})
export class McitTagsInputModule {}
