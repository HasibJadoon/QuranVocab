import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { ICategoriesConfig, IFacetOptions } from '../../facet-options';
import { ICategoriesModel, IFacetDataModel } from '../../facet-model';

@Component({
  selector: 'mcit-categories-facet-modal',
  templateUrl: './categories-modal.component.html',
  styleUrls: ['./categories-modal.component.scss']
})
export class McitCategoriesModalComponent implements OnInit {
  options: IFacetOptions;
  categoriesConfig: ICategoriesConfig;
  categories: ICategoriesModel = {};
  data: IFacetDataModel;

  constructor(private dialogRef: McitDialogRef<McitCategoriesModalComponent>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.options = data.options;
    this.categoriesConfig = data.categoriesConfig;
    this.data = data.data;
    this.categories = data.categories;
  }

  ngOnInit(): void {}

  doClose(): void {
    this.dialogRef.close();
  }

  doApply(): void {
    this.dialogRef.close(this.categories);
  }
}
