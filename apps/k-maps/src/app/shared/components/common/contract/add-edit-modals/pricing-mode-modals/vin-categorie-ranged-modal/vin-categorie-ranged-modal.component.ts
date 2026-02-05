import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { ICategory } from '@lib-shared/common/models/category.model';
import { IRangePrice } from '@lib-shared/common/models/contract/categories-dialog.model';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { CategoriesHttpService } from '@lib-shared/common/contract/services/categories-http.service';
import { DispatcherApiRoutesEnum } from '../../../../../../../../dispatcher/src/app/business/services/offers-http.service';

@Component({
  selector: 'mcit-vin-categorie-ranged-modal',
  templateUrl: './vin-categorie-ranged-modal.component.html',
  styleUrls: ['./vin-categorie-ranged-modal.component.scss']
})
export class VinCategoryRangedModalComponent implements OnInit, OnDestroy {
  vinCategoryRangedPriceForm: UntypedFormGroup;

  categories$: Observable<ICategory[]>;

  categoryItem: IRangePrice;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      ownerId: string;
      categories_range: IRangePrice[];
      isDisabled: boolean;
      apiRoute: DispatcherApiRoutesEnum;
    },
    private dialogRef: McitDialogRef<VinCategoryRangedModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private categoriesHttpService: CategoriesHttpService
  ) {}

  ngOnInit(): void {
    this.vinCategoryRangedPriceForm = this.formBuilder.group(
      {
        _category_item: this.formBuilder.group({
          category_code: [{ value: '', disabled: this.modalData.isDisabled }],
          range: this.formBuilder.group({
            min: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            max: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
          })
        }),
        categories_grid: [{ value: [], disabled: this.modalData.isDisabled }, Validators.required]
      },
      { validator: checkIfMaxisHigherThanMin }
    );

    if (this.modalData.categories_range) {
      this.vinCategoryRangedPriceForm.get('categories_grid').setValue(this.modalData.categories_range);
    }
    this.subscriptions.push(
      this.vinCategoryRangedPriceForm.get('_category_item').valueChanges.subscribe((next) => {
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

  checkError(): boolean {
    return this.vinCategoryRangedPriceForm.hasError('minHigherThanMax');
  }

  doAddItem(): void {
    let categoriesGrid = this.vinCategoryRangedPriceForm.get('categories_grid').value;
    if (!categoriesGrid) {
      categoriesGrid = [];
    }
    categoriesGrid.push(this.categoryItem);

    this.vinCategoryRangedPriceForm.get('categories_grid').setValue(categoriesGrid);

    this.categoryItem = null;
    this.vinCategoryRangedPriceForm.get('_category_item').reset({ category_code: '' });
  }

  doDeleteCategoryItem(i: number): void {
    const categoriesGrid = this.vinCategoryRangedPriceForm.get('categories_grid').value as IRangePrice[];
    this.vinCategoryRangedPriceForm.get('categories_grid').setValue(categoriesGrid.filter((elm, index) => index !== i));
  }

  doSave(): void {
    this.dialogRef.close(this.vinCategoryRangedPriceForm.get('categories_grid').value);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}

function checkIfMaxisHigherThanMin(rangePriceForm: AbstractControl): { minHigherThanMax: boolean } {
  if (rangePriceForm.get('_category_item.range.min').value === null || rangePriceForm.get('_category_item.range.max').value === null) {
    return null;
  } else if (rangePriceForm.get('_category_item.range.min').value > rangePriceForm.get('_category_item.range.max').value) {
    return { minHigherThanMax: true };
  } else {
    return null;
  }
}
