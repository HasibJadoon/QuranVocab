import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Observable, EMPTY, Subscription } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { ICategory } from '@lib-shared/common/models/category.model';
import { IRangePrice } from '@lib-shared/common/models/contract/categories-dialog.model';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { CategoriesHttpService } from '@lib-shared/common/contract/services/categories-http.service';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';

@Component({
  selector: 'mcit-trip-categorie-range-modal',
  templateUrl: './trip-categorie-range-modal.component.html',
  styleUrls: ['./trip-categorie-range-modal.component.scss']
})
export class TripCategoryRangeModalComponent implements OnInit, OnDestroy {
  tripCategoryRangePriceForm: UntypedFormGroup;

  categories$: Observable<ICategory[]>;

  nbVehiclesItem: IRangePrice;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      ownerId: string;
      categories_range: IRangePrice[];
      isDisabled: boolean;
      apiRoute: DispatcherApiRoutesEnum;
    },
    private dialogRef: McitDialogRef<TripCategoryRangeModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private categoriesHttpService: CategoriesHttpService
  ) {}

  ngOnInit(): void {
    this.tripCategoryRangePriceForm = this.formBuilder.group(
      {
        _nb_vehicles_item: this.formBuilder.group({
          nb_vehicles: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          category_code: [{ value: '', disabled: this.modalData.isDisabled }],
          range: this.formBuilder.group({
            min: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            max: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
            price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
          })
        }),
        nb_vehicles_grid: [[], Validators.required]
      },
      { validator: checkIfMaxisHigherThanMin }
    );

    if (this.modalData.categories_range) {
      this.tripCategoryRangePriceForm.get('nb_vehicles_grid').setValue(this.modalData.categories_range);
    }
    this.subscriptions.push(
      this.tripCategoryRangePriceForm.get('_nb_vehicles_item').valueChanges.subscribe((next) => {
        if (next) {
          this.nbVehiclesItem = next;
        } else {
          this.nbVehiclesItem = null;
        }
      })
    );

    this.categories$ = this.getCategoriesPage(1).pipe(
      expand((data, i) => (data.next ? this.getCategoriesPage(data.next) : EMPTY)),
      map((data) => data.results),
      reduce((acc, data) => acc.concat(data), [])
    );
  }

  checkError(): boolean {
    return this.tripCategoryRangePriceForm.hasError('minHigherThanMax');
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

  doAddNbVehiclesItem(): void {
    let nbVehiclesGrid = this.tripCategoryRangePriceForm.get('nb_vehicles_grid').value as IRangePrice[];
    if (!nbVehiclesGrid) {
      nbVehiclesGrid = [];
    }

    nbVehiclesGrid.push(this.nbVehiclesItem);

    this.tripCategoryRangePriceForm.get('nb_vehicles_grid').setValue(
      nbVehiclesGrid.sort((a, b) => {
        if (a.nb_vehicles < b.nb_vehicles) {
          return -1;
        } else if (a.nb_vehicles > b.nb_vehicles) {
          return 1;
        } else if (a.category_code && b.category_code) {
          return -a.category_code.localeCompare(b.category_code);
        } else if (a.category_code) {
          return -1;
        } else if (b.category_code) {
          return 1;
        }
        return 0;
      })
    );

    this.nbVehiclesItem = null;
    this.tripCategoryRangePriceForm.get('_nb_vehicles_item').reset({ category_code: '' });
  }

  doDeleteNbVehiclesItem(index: number): void {
    const categoriesGrid = this.tripCategoryRangePriceForm.get('nb_vehicles_grid').value;
    this.tripCategoryRangePriceForm.get('nb_vehicles_grid').setValue(categoriesGrid.filter((v, i) => i !== index));
  }

  doSave(): void {
    this.dialogRef.close(this.tripCategoryRangePriceForm.get('nb_vehicles_grid').value);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}

function checkIfMaxisHigherThanMin(rangePriceForm: AbstractControl): { minHigherThanMax: boolean } {
  if (rangePriceForm.get('_nb_vehicles_item.range.min').value === null || rangePriceForm.get('_nb_vehicles_item.range.max').value === null) {
    return null;
  } else if (rangePriceForm.get('_nb_vehicles_item.range.min').value > rangePriceForm.get('_nb_vehicles_item.range.max').value) {
    return { minHigherThanMax: true };
  } else {
    return null;
  }
}
