import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { ITableOptions, StripeMode } from '../table-options';
import * as lodash from 'lodash';
import { McitMenuDropdownService } from '../../menu-dropdown/menu-dropdown.service';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { McitMoveColumnsModalService } from '../move-columns-modal/move-columns-modal.service';
import { catchError, concatMap, map, switchMap } from 'rxjs/operators';
import { McitEditTextModalService } from '../../edit-text-modal/edit-text-modal.service';
import { McitCoreConfig } from '../../helpers/provider.helper';
import { McitTablePrefsHttpService } from '../../services/table-prefs-http.service';
import { McitPopupService } from '../../services/popup.service';
import { McitSaveService } from '../save/save.service';
import { IActionConfigExt, IColumnConfigExt, IPagination, Mode, TextSize } from '../table.component';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

const DEFAULT_OPTIONS: ITableOptions<any> = {
  header: {
    type: 'normal'
  },
  columns: {
    hiddenable: true,
    moveable: true,
    columnsConfig: {}
  },
  actions: { mode: 'column', column: { type: 'auto' } },
  doubleScroll: false,
  stripe: {
    mode: 'none'
  }
};

const STRIPE_OPTIONS = [
  {
    code: 'none',
    nameKey: 'TABLE_COMPONENT.STRIPES.NONE'
  },
  {
    code: 'horizontal',
    nameKey: 'TABLE_COMPONENT.STRIPES.HORIZONTAL'
  },
  {
    code: 'vertical',
    nameKey: 'TABLE_COMPONENT.STRIPES.VERTICAL'
  },
  {
    code: 'both',
    nameKey: 'TABLE_COMPONENT.STRIPES.BOTH'
  }
];

export interface ISaveStorage {
  text_size: TextSize;
  show_line_number: boolean;
  stripe: StripeMode;
  columns: {
    [key: string]: {
      width?: number;
      visible?: boolean;
      position?: number;
    };
  };
}

@Component({
  selector: 'mcit-table-options',
  templateUrl: './table-options.component.html',
  styleUrls: ['./table-options.component.scss']
})
export class McitTableOptionsComponent<E> {
  private _options: ITableOptions<E>;

  @Input()
  title: string;

  @Input()
  totalLines: string;

  @Input()
  set options(options: ITableOptions<E>) {
    this._options = lodash.defaultsDeep(options, DEFAULT_OPTIONS);

    this.changeOptions();
  }

  get options(): ITableOptions<E> {
    return this._options;
  }

  @Output()
  optionsChanged = new EventEmitter<ITableOptions<E>>();

  private _pagination: IPagination;
  startLine: number;

  @Input()
  set pagination(pagination: IPagination) {
    this._pagination = pagination;
    this.startLine = (pagination?.page - 1) * pagination?.per_page + 1;
  }

  get pagination(): IPagination {
    return this._pagination;
  }

  readonly textSize$ = new BehaviorSubject<TextSize>('normal');
  readonly mode$ = new BehaviorSubject<Mode>(null);
  readonly showLineNumber$ = new BehaviorSubject<boolean>(false);
  readonly stripe$ = new BehaviorSubject<StripeMode>('none');
  readonly columns$ = new BehaviorSubject<IColumnConfigExt<E>[]>([]);
  readonly actions$ = new BehaviorSubject<IActionConfigExt<E>[]>([]);

  constructor(
    private config: McitCoreConfig,
    private menuDropdownService: McitMenuDropdownService,
    private storage: McitStorage,
    private moveColumnsModalService: McitMoveColumnsModalService,
    private editTextModalService: McitEditTextModalService,
    private tablePrefsHttpService: McitTablePrefsHttpService,
    private popupService: McitPopupService,
    private saveService: McitSaveService
  ) {}

  private changeOptions(): void {
    if (this.options?.save?.id) {
      const key = `table-${this.options.save.id}`;

      timer(300)
        .pipe(concatMap(() => this.storage.get(key)))
        .subscribe((next: ISaveStorage) => {
          this.restoreOptions(next);
          this.optionsChanged.emit(this.options);
        });
    } else {
      this.restoreOptions(null);
      this.optionsChanged.emit(this.options);
    }
  }

  private restoreOptions(saveStorage: ISaveStorage): void {
    this.textSize$.next(saveStorage?.text_size || this.options?.config?.textSize || 'normal');
    this.showLineNumber$.next(saveStorage?.show_line_number || this.options?.row?.showLineNumber || false);
    this.stripe$.next(saveStorage?.stripe || this.options?.stripe?.mode || 'none');

    this.columns$.next(
      Object.keys(this.options?.columns?.columnsConfig).map((x, i) => {
        const column = this.options.columns.columnsConfig[x];
        const s = saveStorage?.columns?.[x];
        let v: boolean;
        if (s?.visible != null) {
          v = s.visible;
        } else {
          v = column.visibility == null || column.visibility === 'visible';
        }
        let w: number;
        if (s?.width != null) {
          w = s.width;
        }
        let p: number = i;
        if (s?.position != null) {
          p = s.position;
        }
        return {
          key: x,
          visible: v,
          resizeWidth: w,
          position: p,
          ...column
        };
      }) || []
    );

    this.actions$.next(
      this.options?.actions?.actionsConfig
        ? Object.keys(this.options?.actions?.actionsConfig).map((x) => ({
            key: x,
            visible: true,
            ...this.options.actions.actionsConfig[x]
          }))
        : []
    );
  }

  saveCurrent(): void {
    if (this.options?.save?.id) {
      const key = `table-${this.options.save.id}`;
      this.storage.set(key, this.buildCurrent()).subscribe();
    }
  }

  private buildCurrent(): ISaveStorage {
    return {
      text_size: this.textSize$.value,
      show_line_number: this.showLineNumber$.value,
      stripe: this.stripe$.value,
      columns: this.columns$.value.reduce((acc, x, i) => {
        const p = {
          visible: null,
          width: null,
          position: null
        };
        if ((x.visible && x.visibility === 'hidden') || (!x.visible && (x.visibility == null || x.visibility === 'visible'))) {
          p.visible = x.visible;
        }
        if (x.resizeWidth != null) {
          p.width = x.resizeWidth;
        }
        if (x.position != null && x.position !== i) {
          p.position = x.position;
        }
        acc[x.key] = lodash.omitBy(p, lodash.isNil);
        return acc;
      }, {})
    };
  }

  doChangeTextSize(textSize: TextSize): void {
    this.textSize$.next(textSize);

    this.saveCurrent();
  }

  doToggleMode(mode: Mode): void {
    this.mode$.next(this.mode$.value === mode ? null : mode);
  }

  doToggleVisibleColumn(column: IColumnConfigExt<E>): void {
    column.visible = !column.visible;
    this.columns$.next(this.columns$.value);

    this.saveCurrent();
  }

  doShowMove(): void {
    this.mode$.next(null);
    this.moveColumnsModalService.showMoveColumns(lodash.cloneDeep(this.columns$.value), this.options?.columns.hiddenable).subscribe((next) => {
      if (next) {
        this.columns$.next(next);

        this.saveCurrent();
      }
    });
  }

  doSaveFavorite(): void {
    this.editTextModalService.editText('text', 'TABLE_COMPONENT.SAVE_FAVORITE', '', 'text', true).subscribe((next) => {
      if (next) {
        this.saveFavorite(next.value).subscribe(
          () => {
            this.popupService.showSuccess('TABLE_COMPONENT.FAVORITE_SAVED', {
              messageParams: {
                name: next.value
              }
            });
          },
          (err) => {
            this.popupService.showError();
          }
        );
      }
    });
  }

  saveFavorite(name: string): Observable<any> {
    const key = `table-${this.config.app}-${this.options.save.id}`;
    return this.tablePrefsHttpService.get(key, 'favorites').pipe(
      concatMap((ss) => {
        if (!ss) {
          ss = {
            favorites: []
          };
        }

        ss.favorites = ss.favorites.filter((f) => f.name !== name);

        ss.favorites.push({
          name: name,
          value: this.buildCurrent(),
          created_date: new Date()
        });
        return this.tablePrefsHttpService.save(key, ss);
      })
    );
  }

  doShowFavorites(button: HTMLElement): void {
    this.saveService.showSave<E>(button, this.options).subscribe((next) => {
      if (next) {
        this.restoreOptions(next.favorite.value);

        this.saveCurrent();
      }
    });
  }

  doToggleShowLineNumber(): void {
    this.showLineNumber$.next(!this.showLineNumber$.value);

    this.saveCurrent();
  }

  doChooseStripe(button: ElementRef | HTMLElement): void {
    this.menuDropdownService
      .chooseOptions(
        button,
        STRIPE_OPTIONS.filter((s) => this.options?.stripe?.modes == null || this.options?.stripe?.modes.indexOf(s.code as StripeMode) !== -1),
        this.stripe$.value
      )
      .subscribe((next) => {
        if (next) {
          this.stripe$.next(next as StripeMode);

          this.saveCurrent();
        }
      });
  }

  refreshFavorite() {
    timer(0)
      .pipe(
        concatMap((r) =>
          this.storage.get(`${this.options.save.id}-current-favorite`).pipe(
            switchMap((currentFavoriteName) =>
              currentFavoriteName && currentFavoriteName != ''
                ? this.tablePrefsHttpService.get(`table-${this.config.app}-${this.options.save.id}`, 'favorites').pipe(
                    catchError((err) => {
                      this.popupService.showError();
                      return of(null);
                    }),
                    map((results) => lodash.find(results?.favorites, (f) => f.name === currentFavoriteName)?.value)
                  )
                : of(null)
            )
          )
        )
      )
      .subscribe((next) => {
        if (next) {
          this.restoreOptions(next);
          this.optionsChanged.emit(this.options);
        }
      });
  }
}
