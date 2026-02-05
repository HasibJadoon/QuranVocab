import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { IFixedPrice } from '@lib-shared/common/models/contract/categories-dialog.model';
import { ICategory } from '@lib-shared/common/models/category.model';
import { CategoriesHttpService } from '@lib-shared/common/contract/services/categories-http.service';
import { DispatcherApiRoutesEnum } from '../../../../../../../../dispatcher/src/app/business/services/offers-http.service';

@Component({
  selector: 'mcit-vin-categorie-fixed-modal',
  templateUrl: './vin-categorie-fixed-modal.component.html',
  styleUrls: ['./vin-categorie-fixed-modal.component.scss']
})
export class VinCategoryFixedModalComponent implements OnInit, OnDestroy {
  vinCategoryFixedPriceForm: UntypedFormGroup;

  categories$: Observable<ICategory[]>;

  categoryItem: IFixedPrice;

  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      ownerId: string;
      categories_fixed: IFixedPrice[];
      apiRoute: DispatcherApiRoutesEnum;
      isDisabled: boolean;
    },
    private dialogRef: McitDialogRef<VinCategoryFixedModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private categoriesHttpService: CategoriesHttpService
  ) {}

  ngOnInit(): void {
    this.vinCategoryFixedPriceForm = this.formBuilder.group({
      _category_item: this.formBuilder.group({
        category_code: [{ value: '', disabled: this.modalData.isDisabled }, Validators.required],
        price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
      }),
      categories_grid: [{ value: [], disabled: this.modalData.isDisabled }, Validators.required]
    });

    if (this.modalData.categories_fixed) {
      this.vinCategoryFixedPriceForm.get('categories_grid').setValue(this.modalData.categories_fixed);
    }
    this.subscriptions.push(
      this.vinCategoryFixedPriceForm.get('_category_item').valueChanges.subscribe((next) => {
        if (next) {
          this.categoryItem = next;
        } else {
          this.categoryItem = null;
        }
      })
    );

    this.categories$ = this.getCategoriesPage(1).pipe(
      expand((data, i) => (data.next ? this.getCategoriesPage(data.next) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), [])
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private getCategoriesPage(page: number): Observable<{ next: number; results: ICategory[] }> {
    return this.categoriesHttpService.search('', this.modalData.ownerId, page, 100, 'code', 'code').pipe(
      map((resp) => {
        const totalPages = Number(resp.headers.get('X-TOTAL-PAGES'));
        return {
          next: page < totalPages ? page + 1 : 0,
          results: resp.body
        };
      })
    );
  }

  doAddItem(): void {
    let categoriesGrid = this.vinCategoryFixedPriceForm.get('categories_grid').value;
    if (!categoriesGrid) {
      categoriesGrid = [];
    }
    categoriesGrid.push({ category_code: this.categoryItem.category_code, price: this.categoryItem.price });

    this.vinCategoryFixedPriceForm.get('categories_grid').setValue(categoriesGrid);

    this.categoryItem = null;
    this.vinCategoryFixedPriceForm.get('_category_item').reset({ category_code: '' });
  }

  doDeleteCategoryItem(i: number): void {
    const categoriesGrid = this.vinCategoryFixedPriceForm.get('categories_grid').value;
    this.vinCategoryFixedPriceForm.get('categories_grid').setValue(categoriesGrid.filter((elm, index) => index !== i));
  }

  doSave(): void {
    this.dialogRef.close(this.vinCategoryFixedPriceForm.get('categories_grid').value);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
