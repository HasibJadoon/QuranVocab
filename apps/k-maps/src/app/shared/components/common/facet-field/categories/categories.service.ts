import { Injectable } from '@angular/core';
import { McitDialog } from '../../dialog/dialog.service';
import { Observable } from 'rxjs';
import { McitCategoriesModalComponent } from './categories-modal/categories-modal.component';
import { ICategoriesConfig, IFacetOptions } from '../facet-options';
import { ICategoriesModel, IFacetDataModel } from '../facet-model';

@Injectable()
export class McitCategoriesService {
  constructor(private dialog: McitDialog) {}

  showCategories(options: IFacetOptions, categoriesConfig: ICategoriesConfig, categories: ICategoriesModel, data: IFacetDataModel): Observable<any> {
    return this.dialog
      .open(McitCategoriesModalComponent, {
        dialogClass: 'modal-full',
        data: {
          options,
          categoriesConfig,
          categories,
          data
        },
        disableDrag: true
      })
      .afterClosed();
  }
}
