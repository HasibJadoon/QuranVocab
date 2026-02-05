import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitFormsModule } from '../forms/forms.module';
import { CodificationSearchFieldModule } from '../../../../../fvl/src/app/shared/components/codification-search-field/codification-search-field.module';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { McitCommonModule } from '../common/common.module';
import { McitTranscodingFilterComponent } from './transcoding-filter.component';
import { McitTranscodingFilterService } from './transcoding-filter.service';

@NgModule({
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, McitFormsModule, McitTooltipModule, McitCommonModule, CodificationSearchFieldModule],
  declarations: [McitTranscodingFilterComponent],
  exports: [McitTranscodingFilterComponent],
  providers: [McitTranscodingFilterService]
})
export class McitTranscodingFilterModule {}
