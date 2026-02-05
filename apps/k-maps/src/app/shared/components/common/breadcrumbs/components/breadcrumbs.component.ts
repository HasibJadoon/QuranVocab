import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { IBreadCrumb } from '../models/breadcrumb';
import { BreadCrumbState } from '../states/breadcrumb.state';

@Component({
  selector: 'mcit-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styles: [
    `
      nav > * {
        background: transparent;
      }

      li.breadcrumb-item:not(:last-child) > a {
        color: #3fa2c4;
        font-weight: 400;
        cursor: pointer;
      }
    `
  ]
})
export class McitBreadCrumbComponent implements OnInit {
  breadcrumbs$: Observable<Array<IBreadCrumb>>;

  constructor(private _store: Store<any>) {}

  ngOnInit(): void {
    this.breadcrumbs$ = this._store.pipe(
      select('breadcrumbs'),
      map((c: BreadCrumbState) => c.breadcrumbs)
    );
  }

  trakcByCrumb(index: number, item: IBreadCrumb): string {
    return `${item.depth}`;
  }
}
