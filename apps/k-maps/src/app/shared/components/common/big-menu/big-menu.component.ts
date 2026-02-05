import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, merge, of, ReplaySubject, Subject, timer } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, concatMap, map, switchMap, tap } from 'rxjs/operators';
import * as lodash from 'lodash';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

export interface IItem {
  image: string;
  info: string;
  route: string;
  group?: string;
}

export interface IOptions {
  saveId?: string;
  size?: 'large' | 'normal';
}

interface IFavoriteItem extends IItem {
  favorite: boolean;
}

@Component({
  selector: 'mcit-big-menu',
  templateUrl: './big-menu.component.html',
  styleUrls: ['./big-menu.component.scss']
})
export class McitBigMenuComponent implements OnInit {
  @Input()
  options: IOptions;

  @Input()
  set items(items: IItem[]) {
    this.itemsSubject.next(items ?? []);
  }

  itemsContainer$: Observable<{ favorites: IFavoriteItem[]; groups: { name: string; items: IFavoriteItem[] }[] }>;

  private itemsSubject = new ReplaySubject<IItem[]>(1);
  private refreshSubject = new Subject<void>();

  constructor(private storage: McitStorage) {}

  ngOnInit(): void {
    this.itemsContainer$ = combineLatest([
      this.itemsSubject.asObservable(),
      merge(timer(0), this.refreshSubject.asObservable()).pipe(
        switchMap(() =>
          this.options?.saveId != null
            ? this.storage.get(`big-menu-save-${this.options.saveId}`).pipe(
                map((res) => res ?? ([] as string[])),
                catchError(() => of([] as string[]))
              )
            : of([] as string[])
        )
      )
    ]).pipe(
      map(([items, favs]) => ({
        favorites: lodash.compact(favs.map((f) => items.find((i) => i.info === f))).map((i: IItem) => ({
          ...i,
          favorite: true
        })),
        groups: items.reduce((acc, x) => {
          let el = acc.find((e) => (e.name == null && x.group == null) || e.name === x.group);
          if (el == null) {
            el = { name: x.group, items: [] };
            acc.push(el);
          }
          el.items.push({
            ...x,
            favorite: favs.some((f) => f === x.info)
          });
          return acc;
        }, [])
      }))
    );
  }

  trackByItem(index: number, item: IItem): string {
    return item.info;
  }

  doToggleFav(item: IItem): void {
    this.storage
      .get(`big-menu-save-${this.options.saveId}`)
      .pipe(
        map((res) => res ?? ([] as string[])),
        concatMap((res) => this.storage.set(`big-menu-save-${this.options.saveId}`, res.indexOf(item.info) !== -1 ? res.filter((r) => r !== item.info) : lodash.concat(res ?? [], item.info))),
        tap(() => this.refreshSubject.next())
      )
      .subscribe();
  }
}
