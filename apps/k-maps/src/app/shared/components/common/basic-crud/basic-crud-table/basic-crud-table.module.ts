import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitBasicCrudTableComponent } from './basic-crud-table.component';
import { McitTableModule } from '../../table/table.module';
import { McitPaginationModule } from '../../pagination/pagination.module';
import { FormsModule } from '@angular/forms';
import { McitSearchFieldModule } from '../../search/search.module';
import { McitFacetFieldModule } from '../../facet-field/facet-field.module';
import { McitMultipleFiltersModalModule } from '../../multiple-filters-modal/multiple-filters-modal.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitTableModule, McitPaginationModule, FormsModule, McitSearchFieldModule, McitFacetFieldModule, McitMultipleFiltersModalModule],
  declarations: [McitBasicCrudTableComponent],
  exports: [McitBasicCrudTableComponent]
})
export class McitBasicCrudTableModule {}
