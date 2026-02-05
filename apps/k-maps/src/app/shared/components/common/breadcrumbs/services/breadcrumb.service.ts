import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreadCrumbState } from '../states/breadcrumb.state';
import { EBreadCrumbAction } from '../actions/breadcrumb.actions';
import { IBreadCrumb } from '../models/breadcrumb';

@Injectable({
  providedIn: 'root'
})
export class McitBreadCrumbService {
  private nameSpace: string;
  private collections: Array<{
    sub: Subscription;
    depth: number;
  }> = [];

  constructor(private _store: Store<BreadCrumbState>) {}

  public addBreadCrumb(label: Observable<string>, action: Observable<any>): number {
    const index = this.collections.length;
    let first = true;
    this.collections.push({
      sub: combineLatest([label, action, of(index)])
        .pipe(
          map(
            (results): IBreadCrumb => ({
              label: results[0].toLocaleUpperCase(),
              action: results[1],
              depth: results[2]
            })
          )
        )
        .subscribe((bc: IBreadCrumb) => {
          if (first === false) {
            this._store.dispatch({
              type: EBreadCrumbAction.Update,
              breadcrumb: bc
            });
          }
          if (first === true) {
            this._store.dispatch({
              type: EBreadCrumbAction.Add,
              breadcrumb: bc
            });
            first = false;
          }
        }),
      depth: index
    });
    return index;
  }

  public useNameSpace(name: string): McitBreadCrumbService {
    if (this.nameSpace !== name) {
      this.nameSpace = name;
      this._store.dispatch({ type: EBreadCrumbAction.Reset });
      this.collections = [];
    }
    return this;
  }

  public removeBreadCrumb(depth: number) {
    this.collections.forEach((bc: { sub: Subscription; depth: number }) => {
      if (bc.depth < depth) {
        return;
      } else {
        bc.sub.unsubscribe();
      }
    });
    this.collections = this.collections.slice(0, depth);
    this._store.dispatch({ type: EBreadCrumbAction.Delete, depth });
  }
}
