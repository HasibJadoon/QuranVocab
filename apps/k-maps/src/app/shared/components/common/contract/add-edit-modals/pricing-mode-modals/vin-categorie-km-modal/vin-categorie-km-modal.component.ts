import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { ICategory } from '@lib-shared/common/models/category.model';
import { IKmPrice } from '@lib-shared/common/models/contract/categories-dialog.model';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { CategoriesHttpService } from '@lib-shared/common/contract/services/categories-http.service';
import { DispatcherApiRoutesEnum } from '../../../../../../../../dispatcher/src/app/business/services/offers-http.service';

@Component({
  selector: 'mcit-vin-categorie-km-modal',
  templateUrl: './vin-categorie-km-modal.component.html',
  styleUrls: ['./vin-categorie-km-modal.component.scss']
})
export class VinCategoryKmModalComponent implements OnInit, OnDestroy {
  vinCategoryKmPriceForm: UntypedFormGroup;

  categories$: Observable<ICategory[]>;

  categoryItem: IKmPrice;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      ownerId: string;
      categories_km: IKmPrice[];
      apiRoute: DispatcherApiRoutesEnum;
      isDisabled: boolean;
    },
    private dialogRef: McitDialogRef<VinCategoryKmModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private categoriesHttpService: CategoriesHttpService
  ) {}

  ngOnInit(): void {
    this.vinCategoryKmPriceForm = this.formBuilder.group({
      _category_item: this.formBuilder.group({
        category_code: [{ value: '', disabled: this.modalData.isDisabled }, Validators.required],
        km: this.formBuilder.group({
          threshold: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          base_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          unit_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          min_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
        })
      }),
      categories_grid: [[], Validators.required]
    });

    if (this.modalData.categories_km) {
      this.vinCategoryKmPriceForm.get('categories_grid').setValue(this.modalData.categories_km);
    }
    this.subscriptions.push(
      this.vinCategoryKmPriceForm.get('_category_item').valueChanges.subscribe((next) => {
        if (next) {
          this.categoryItem = next;
        } else {
          this.categoryItem = null;
        }
      })
    );

    this.categories$ = this.getCategoriesPage(1).pipe(
      expand((data) => (data.next ? this.getCategoriesPage(data.next) : EMPTY)),
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
    let categoriesGrid = this.vinCategoryKmPriceForm.get('categories_grid').value;
    if (!categoriesGrid) {
      categoriesGrid = [];
    }
    categoriesGrid.push(this.categoryItem);

    this.vinCategoryKmPriceForm.get('categories_grid').setValue(categoriesGrid);

    this.categoryItem = null;
    this.vinCategoryKmPriceForm.get('_category_item').reset({ category_code: '' });
  }

  doDeleteCategoryItem(i: number): void {
    const categoriesGrid = this.vinCategoryKmPriceForm.get('categories_grid').value;
    this.vinCategoryKmPriceForm.get('categories_grid').setValue(categoriesGrid.filter((elem, index) => index !== i));
  }

  doSave(): void {
    this.dialogRef.close(this.vinCategoryKmPriceForm.get('categories_grid').value);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
