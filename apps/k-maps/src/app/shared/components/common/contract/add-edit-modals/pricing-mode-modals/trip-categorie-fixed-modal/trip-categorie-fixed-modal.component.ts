import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { IFixedPrice } from '@lib-shared/common/models/contract/categories-dialog.model';
import { ICategory } from '@lib-shared/common/models/category.model';
import { DispatcherApiRoutesEnum } from '@lib-shared/common/contract/dispatcher-api-routes.domain';
import { CategoriesHttpService } from '@lib-shared/common/contract/services/categories-http.service';

@Component({
  selector: 'mcit-trip-categorie-fixed-modal',
  templateUrl: './trip-categorie-fixed-modal.component.html',
  styleUrls: ['./trip-categorie-fixed-modal.component.scss']
})
export class TripCategoryFixedModalComponent implements OnInit, OnDestroy {
  tripCategoryFixedPriceForm: UntypedFormGroup;

  categories$: Observable<ICategory[]>;

  nbVehiclesItem: IFixedPrice;

  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MCIT_DIALOG_DATA)
    public modalData: {
      ownerId: string;
      categories_fixed: IFixedPrice[];
      apiRoute: DispatcherApiRoutesEnum;
      isDisabled: boolean;
    },
    private dialogRef: McitDialogRef<TripCategoryFixedModalComponent>,
    private formBuilder: UntypedFormBuilder,
    private categoriesHttpService: CategoriesHttpService
  ) {}

  ngOnInit(): void {
    this.tripCategoryFixedPriceForm = this.formBuilder.group({
      _nb_vehicles_item: this.formBuilder.group({
        nb_vehicles: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])],
        category_code: [{ value: '', disabled: this.modalData.isDisabled }],
        price: [{ value: '', disabled: this.modalData.isDisabled }, Validators.compose([Validators.min(0), Validators.required])]
      }),
      nb_vehicles_grid: [{ value: [], disabled: this.modalData.isDisabled }, Validators.required]
    });

    if (this.modalData.categories_fixed) {
      this.tripCategoryFixedPriceForm.get('nb_vehicles_grid').setValue(this.modalData.categories_fixed);
    }
    this.subscriptions.push(
      this.tripCategoryFixedPriceForm.get('_nb_vehicles_item').valueChanges.subscribe((next) => {
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
    let nbVehiclesGrid = this.tripCategoryFixedPriceForm.get('nb_vehicles_grid').value as IFixedPrice[];
    if (!nbVehiclesGrid) {
      nbVehiclesGrid = [];
    }

    nbVehiclesGrid.push(this.nbVehiclesItem);

    this.tripCategoryFixedPriceForm.get('nb_vehicles_grid').setValue(
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
    this.tripCategoryFixedPriceForm.get('_nb_vehicles_item').reset({ category_code: '' });
  }

  doDeleteNbVehiclesItem(index: number): void {
    const categoriesGrid = this.tripCategoryFixedPriceForm.get('nb_vehicles_grid').value as IFixedPrice[];
    this.tripCategoryFixedPriceForm.get('nb_vehicles_grid').setValue(categoriesGrid.filter((v, i) => i !== index));
  }

  doSave(): void {
    this.dialogRef.close(this.tripCategoryFixedPriceForm.get('nb_vehicles_grid').value);
  }

  goBack(): void {
    this.dialogRef.close();
  }
}
