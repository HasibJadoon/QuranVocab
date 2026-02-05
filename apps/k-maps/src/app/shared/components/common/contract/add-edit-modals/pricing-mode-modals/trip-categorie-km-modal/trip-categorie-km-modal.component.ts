import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { ICategory } from '@lib-shared/common/models/category.model';
import { IKmPrice } from '@lib-shared/common/models/contract/categories-dialog.model';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { CategoriesHttpService } from '@lib-shared/common/contract/services/categories-http.service';

@Component({
  selector: 'mcit-trip-categorie-km-modal',
  templateUrl: './trip-categorie-km-modal.component.html',
  styleUrls: ['./trip-categorie-km-modal.component.scss']
})
export class TripCategoryKmModalComponent implements OnInit, OnDestroy {
  tripCategoryKmPriceForm: UntypedFormGroup;

  categories$: Observable<ICategory[]>;

  nbVehiclesItem: IKmPrice;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      ownerId: string;
      categories_km: IKmPrice[];
      isDisabled: boolean;
      apiRoute: DispatcherApiRoutesEnum;
    },
    private dialogRef: McitDialogRef<TripCategoryKmModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private categoriesHttpService: CategoriesHttpService
  ) {}

  ngOnInit(): void {
    this.tripCategoryKmPriceForm = this.formBuilder.group({
      _nb_vehicles_item: this.formBuilder.group({
        nb_vehicles: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
        category_code: [{ value: '', disabled: this.modalData.isDisabled }, Validators.required],
        km: this.formBuilder.group({
          threshold: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          base_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          unit_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
          min_price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
        })
      }),
      nb_vehicles_grid: [[], Validators.required]
    });

    if (this.modalData.categories_km) {
      this.tripCategoryKmPriceForm.get('nb_vehicles_grid').setValue(this.modalData.categories_km);
    }
    this.subscriptions.push(
      this.tripCategoryKmPriceForm.get('_nb_vehicles_item').valueChanges.subscribe((next) => {
        if (next) {
          this.nbVehiclesItem = next;
        } else {
          this.nbVehiclesItem = null;
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
    let categoriesGrid = this.tripCategoryKmPriceForm.get('nb_vehicles_grid').value;
    if (!categoriesGrid) {
      categoriesGrid = [];
    }

    categoriesGrid.push(this.nbVehiclesItem);

    this.tripCategoryKmPriceForm.get('nb_vehicles_grid').setValue(categoriesGrid);

    this.nbVehiclesItem = null;
    this.tripCategoryKmPriceForm.get('_nb_vehicles_item').reset({ category_code: '' });
  }

  doDeleteNbVehiclesItem(i: number): void {
    const categoriesGrid = this.tripCategoryKmPriceForm.get('nb_vehicles_grid').value;
    this.tripCategoryKmPriceForm.get('nb_vehicles_grid').setValue(categoriesGrid.filter((elem, index) => index !== i));
  }

  doSave(): void {
    this.dialogRef.close(this.tripCategoryKmPriceForm.get('nb_vehicles_grid').value);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
