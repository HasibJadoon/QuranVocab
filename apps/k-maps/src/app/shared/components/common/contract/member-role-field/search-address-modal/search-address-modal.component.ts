import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { McitDialogRef } from '@lib-shared/common/dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '@lib-shared/common/dialog/dialog.service';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { AddressesHttpService } from '@lib-shared/common/contract/services/addresses-http.service';

@Component({
  selector: 'mcit-search-address-modal',
  templateUrl: './search-address-modal.component.html',
  styleUrls: ['./search-address-modal.component.scss']
})
export class SearchAddressModalComponent implements OnInit, OnDestroy {
  items: any[] = [];
  total: number;
  per_page = 5;
  searchBox = '';
  querySubject = new Subject<string>();

  waiting = false;

  private refreshSubject = new Subject<boolean>();

  private searchSubscription: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(private dialogRef: McitDialogRef<SearchAddressModalComponent, boolean>, @Inject(MCIT_DIALOG_DATA) data: any, private addressesHttpService: AddressesHttpService, private popupService: McitPopupService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.refreshSubject
        .asObservable()
        .pipe(filter((b) => b))
        .subscribe(() => {
          if (this.searchBox.length < 1) {
            this.items = [];
            return;
          }

          this.waiting = true;

          if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
          }
          this.searchSubscription = this.addressesHttpService
            .search(this.searchBox, 1, this.per_page, {}, 'name', '')
            .pipe(
              tap((res) => {
                this.total = Number(res.headers.get('X-Total'));
              }),
              map((res) => res.body)
            )
            .subscribe(
              (body) => {
                this.waiting = false;
                this.items = body;

                this.searchSubscription = null;
              },
              (err) => {
                this.waiting = true;
                this.popupService.showError();

                this.searchSubscription = null;
              }
            );
        })
    );

    this.subscriptions.push(
      this.querySubject
        .asObservable()
        .pipe(
          debounceTime(300),
          map((q) => (q.length < 1 ? '' : q))
        )
        .subscribe((next) => this.refreshSubject.next(true))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((data) => data.unsubscribe());
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  doEnter(): void {
    if (this.items.length === 1) {
      this.dialogRef.close(this.items[0]);
    }
  }

  doSelect(item: any): void {
    this.dialogRef.close(item);
  }

  doClose(): void {
    this.dialogRef.close();
  }
}
