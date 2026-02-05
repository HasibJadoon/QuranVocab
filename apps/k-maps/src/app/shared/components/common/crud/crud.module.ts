import { NgModule } from '@angular/core';
import { McitSearchFieldModule } from '../search/search.module';
import { McitSearchPaginationBuilder } from './search-pagination-builder';
import { McitPaginationModule } from '../pagination/pagination.module';
import { McitSearchAllBuilder } from './search-all-builder';

@NgModule({
  imports: [McitSearchFieldModule, McitPaginationModule],
  exports: [McitSearchFieldModule, McitPaginationModule],
  providers: [McitSearchPaginationBuilder, McitSearchAllBuilder]
})
export class McitCrudModule {}
