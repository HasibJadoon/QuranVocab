import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitBreadCrumbComponent } from './components/breadcrumbs.component';
import { StoreModule } from '@ngrx/store';
import { BreadCrumbsReducer } from './reducers/breadcrumbs.reducer';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [CommonModule, RouterModule, StoreModule.forFeature('breadcrumbs', BreadCrumbsReducer)],
  declarations: [McitBreadCrumbComponent],
  providers: [],
  exports: [McitBreadCrumbComponent]
})
export class McitBreadCrumbsModule {}
