import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DoCheck,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  RendererFactory2,
  ViewChild
} from '@angular/core';
import * as lodash from 'lodash';
import { ColumnConfig, IActionConfig, ITableOptions, StripeMode } from '@lib-shared/common/table/table-options';
import { McitColumnCustomDirective } from '@lib-shared/common/table/directives/column-custom.directive';
import { McitRowHeaderCustomDirective } from '@lib-shared/common/table/directives/row-header-custom.directive';
import { McitRowExtensionCustomDirective } from '@lib-shared/common/table/directives/row-extension-custom.directive';
import { McitActionColumnCustomDirective } from '@lib-shared/common/table/directives/action-column-custom.directive';
import { McitTableOptionsComponent } from '@lib-shared/common/table/options/table-options.component';
import { forkJoin, from, interval, isObservable, Observable, of, Subscription } from 'rxjs';
import { IResize, McitContainerService } from '@lib-shared/common/layouts/container.service';
import { McitMenuDropdownService } from '@lib-shared/common/menu-dropdown/menu-dropdown.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { concatMap, distinctUntilChanged, filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { McitActionGroupRowCustomDirective } from './directives/action-group-row-custom.directive';

interface IGroupsContainer {
  type: 'groups';
  nameKey: string;
  groups: Observable<{
    type: string;
    value?: {
      page: number;
      total: number;
      results: any[];
      next: ({ page, per_page }) => void | undefined;
    };
  }>;
}

declare let ResizeSensor;

export type IColumnConfigExt<E> = ColumnConfig<E> & {
  key: string;
  visible: boolean;
  resizeWidth: number;
  position: number;
};

export interface IActionConfigExt<E> extends IActionConfig<E> {
  key: string;
}

export interface ISelectEvent<E> {
  item: E;
  index: number;
  select: boolean;
}

export type TextSize = 'small' | 'normal' | 'large';
export type Mode = 'resize' | 'visible';

export interface IPagination {
  page: number;
  total: number | string;
  per_page: number;
}
@Component({
  selector: 'mcit-table-group',
  templateUrl: './table-group.component.html',
  styleUrls: ['./table-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitTableGroupComponent),
      multi: true
    }
  ]
})
export class McitTableGroupComponent<E> implements OnInit, OnDestroy, ControlValueAccessor, DoCheck {
  @ContentChildren(McitColumnCustomDirective, { descendants: false })
  columnCustoms: QueryList<McitColumnCustomDirective>;
  @ContentChild(McitRowHeaderCustomDirective)
  rowHeaderCustom: McitRowHeaderCustomDirective;
  @ContentChild(McitRowExtensionCustomDirective)
  rowExpendableCustom: McitRowExtensionCustomDirective;
  @ContentChild(McitActionColumnCustomDirective)
  actionColumnCustom: McitActionColumnCustomDirective;
  @ContentChild(McitActionGroupRowCustomDirective)
  actionGroupRowCustom: McitActionGroupRowCustomDirective;

  @Input()
  groups: any;

  @Input()
  tableMode: string;

  @Input()
  container: IGroupsContainer;

  @Input()
  options: ITableOptions<E>;

  @Output()
  actionEvent = new EventEmitter<{ action: string; value?: any }>();

  @Input()
  customTableOptionsComponent: McitTableOptionsComponent<E>;
  @ViewChild('defaultTableOptions')
  tableOptionsComponent: McitTableOptionsComponent<E>;

  @ViewChild('doubleNormalScroll')
  doubleNormalScrollElement: ElementRef;
  @ViewChild('normalScroll')
  normalScrollElement: ElementRef;

  @ViewChild('topStickyScroll')
  topStickyScrollElement: ElementRef;
  @ViewChild('doubleStickyScroll')
  doubleStickyScrollElement: ElementRef;
  @ViewChild('stickyScroll')
  stickyScrollElement: ElementRef;
  @ViewChild('stickyHeader')
  stickyHeaderElement: ElementRef;
  @ViewChild('header')
  headerElement: ElementRef;

  private oldOptionsString: string;

  private _items: E[];

  @Input()
  set items(items: E[]) {
    this._items = items;
    this.selecteds = new Array<boolean>(this._items?.length || 0);
    this.changeDetectorRef.detectChanges();
    this.computeSticky();
  }

  get items(): E[] {
    return this._items;
  }

  private _pagination: IPagination;

  @Input()
  set pagination(pagination: IPagination) {
    this._pagination = pagination;

    this.startLine = (pagination?.page - 1) * pagination?.per_page + 1;

    this.changeDetectorRef.detectChanges();
  }

  get pagination(): IPagination {
    return this._pagination;
  }

  @Output()
  textSizeEvent = new EventEmitter<TextSize>();

  @Output()
  perPageEvent = new EventEmitter<number>();

  @Output()
  selectEvent = new EventEmitter<ISelectEvent<E>>();

  isXl = false;
  textSize: TextSize = 'normal';
  mode: Mode = null;
  showLineNumber = false;
  startLine: number;
  stripe: StripeMode = 'none';

  columns: IColumnConfigExt<E>[];
  actions: IActionConfigExt<E>[];

  selecteds: boolean[] = [];

  private pressed = false;
  private resizableMousemove: () => void;
  private resizableMouseup: () => void;
  private startX: number;
  private startWidth: number;
  private propagateChange: (_: any) => any;
  private listenerSubscriptions: Subscription[] = null;
  private resizeSensors: { sensor: any; callback: any }[];
  private containerResize: IResize;
  private _renderer: Renderer2;
  private scrollbarWidth: number;
  private subscriptions: Subscription[] = [];

  constructor(
    private menuDropdownService: McitMenuDropdownService,
    private router: Router,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    private containerService: McitContainerService,
    private rendererFactory: RendererFactory2
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  ngOnInit(): void {
    this.isXl = this.breakpointObserver.isMatched('(min-width: 1200px)');
    this.options = this.options ?? this.customTableOptionsComponent.options;
    const tableOptions = this.customTableOptionsComponent ?? this.tableOptionsComponent;
    this.subscriptions.push(
      this.breakpointObserver.observe('(min-width: 1200px)').subscribe((next) => {
        this.isXl = next.matches;
        this.changeDetectorRef.detectChanges();
      }),

      tableOptions.mode$.subscribe((next) => {
        this.mode = next;
        this.changeDetectorRef.detectChanges();
      }),

      tableOptions.textSize$.subscribe((next) => {
        this.textSize = next;
        this.changeDetectorRef.detectChanges();
        this.textSizeEvent.emit(this.textSize);
      }),

      tableOptions.actions$.subscribe((next) => {
        this.actions = next;
        this.changeDetectorRef.detectChanges();
      }),

      tableOptions.columns$.subscribe((next) => {
        this.columns = next;
        this.changeDetectorRef.detectChanges();
      }),

      tableOptions.showLineNumber$.subscribe((next) => {
        this.showLineNumber = next;
        this.changeDetectorRef.detectChanges();
      }),

      tableOptions.stripe$.subscribe((next) => {
        this.stripe = next;
        this.changeDetectorRef.detectChanges();
      }),

      tableOptions.optionsChanged.subscribe((next) => {
        this.options = next;
        this.changeDetectorRef.detectChanges();
        this.installListeners();
      })
    );
    setTimeout(() => {
      this.horizontalScrollList(null);
    }, 2000);
  }

  trackByGroup(index: number, item: { _id: string }): string {
    return item._id;
  }

  horizontalScrollList(event) {
    const nbRestLinesButtons = document.getElementsByClassName('center-nb-lines');
    for (let i = 0; i < nbRestLinesButtons?.length; i++) {
      const centerElement = nbRestLinesButtons[i] as HTMLElement;
      const tableResponsive = this.normalScrollElement?.nativeElement?.offsetWidth;
      const scrollX = event?.target?.scrollLeft ?? this.normalScrollElement?.nativeElement?.scrollLeft;
      const newLeft = scrollX - (centerElement.offsetWidth - tableResponsive) / 2;
      centerElement.style.left = newLeft + 'px';
    }
  }

  ngDoCheck(): void {
    const optionsString = JSON.stringify(lodash.cloneDeepWith(this.options, (value) => (lodash.isFunction(value) ? null : value)));

    if (optionsString !== this.oldOptionsString) {
      this.oldOptionsString = optionsString;

      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeSensors) {
      this.resizeSensors.forEach((i) => {
        i.sensor.detach(i.callback);
      });
    }
    if (this.listenerSubscriptions) {
      this.listenerSubscriptions.forEach((s) => s.unsubscribe());
    }

    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  computeTotalPages(total: number, test?: any): number {
    return Math.ceil(total / this.pagination.per_page);
  }

  private installListeners(): void {
    if (this.resizeSensors) {
      this.resizeSensors.forEach((i) => {
        i.sensor.detach(i.callback);
      });
      this.resizeSensors = null;
    }
    if (this.listenerSubscriptions) {
      this.listenerSubscriptions.forEach((s) => s.unsubscribe());
      this.listenerSubscriptions = null;
    }

    if (this.options?.header?.type === 'normal') {
      this.scrollbarWidth = this.getScrollbarWidth();

      this.installNormalListeners();
    } else if (this.options?.header?.type === 'sticky') {
      this.scrollbarWidth = this.getScrollbarWidth();

      this.installStickyListeners();
    }
  }

  private getScrollbarWidth(): number {
    const scrollDiv = this._renderer.createElement('div');
    this._renderer.addClass(scrollDiv, 'modal-scrollbar-measure');
    this._renderer.appendChild(document.body, scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this._renderer.removeChild(document.body, scrollDiv);

    return scrollbarWidth;
  }

  private installDoubleScrollListeners(doubleScrollElement: ElementRef, scrollElement: ElementRef): void {
    doubleScrollElement.nativeElement.style.height = 0;
    doubleScrollElement.nativeElement.style.marginBottom = 0;

    const doubleScrollchildren = doubleScrollElement.nativeElement.children;
    const scrollChildren = scrollElement.nativeElement.children;
    for (let i = 0; i < scrollChildren.length; i++) {
      const callback = (ds) => {
        doubleScrollchildren[i].style.width = ds.width + 'px';

        if (scrollChildren[i].clientWidth > doubleScrollElement.nativeElement.clientWidth - 16) {
          doubleScrollElement.nativeElement.style.height = this.scrollbarWidth + 'px';
          doubleScrollElement.nativeElement.style.marginBottom = '8px';
        } else {
          doubleScrollElement.nativeElement.style.height = 0;
          doubleScrollElement.nativeElement.style.marginBottom = 0;
        }
      };
      doubleScrollchildren[i].style.height = this.scrollbarWidth + 'px';
      const sensor = new ResizeSensor(scrollChildren[i], callback);
      this.resizeSensors.push({ sensor, callback });
    }
  }

  private installNormalListeners(): void {
    this.resizeSensors = [];

    this.installDoubleScrollListeners(this.doubleNormalScrollElement, this.normalScrollElement);

    this.listenerSubscriptions = [];

    this.listenerSubscriptions.push(
      interval(50)
        .pipe(
          map(() => this.doubleNormalScrollElement.nativeElement.scrollLeft),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.normalScrollElement.nativeElement.scrollLeft = this.doubleNormalScrollElement.nativeElement.scrollLeft;
        })
    );

    this.listenerSubscriptions.push(
      interval(50)
        .pipe(
          map(() => this.normalScrollElement.nativeElement.scrollLeft),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.doubleNormalScrollElement.nativeElement.scrollLeft = this.normalScrollElement.nativeElement.scrollLeft;
        })
    );
  }

  private installStickyListeners(): void {
    this.resizeSensors = [];

    this.installDoubleScrollListeners(this.doubleStickyScrollElement, this.stickyScrollElement);

    const snodes = this.stickyHeaderElement.nativeElement.children;
    const nodes = this.headerElement.nativeElement.children;
    for (let i = 0; i < nodes.length; i++) {
      const callback = (ds) => {
        snodes[i].style.width = ds.width + 'px';
      };
      const sensor = new ResizeSensor(nodes[i], callback);
      this.resizeSensors.push({ sensor, callback });
    }

    const stickyCallback = () => {
      const rect = this.stickyScrollElement.nativeElement.getBoundingClientRect();
      this.topStickyScrollElement.nativeElement.style.left = rect.left + 'px';
      this.topStickyScrollElement.nativeElement.style.width = rect.width + 'px';
    };
    const stickySensor = new ResizeSensor(this.stickyScrollElement.nativeElement, stickyCallback);
    this.resizeSensors.push({ sensor: stickySensor, callback: stickyCallback });

    this.topStickyScrollElement.nativeElement.style.height = 0;

    this.listenerSubscriptions = [];

    this.listenerSubscriptions.push(
      this.containerService.resize$().subscribe((next) => {
        this.containerResize = next;

        this.topStickyScrollElement.nativeElement.style.top = next?.marginTop + 'px';
      })
    );

    this.listenerSubscriptions.push(
      interval(50)
        .pipe(
          map(() => this.headerElement.nativeElement.getBoundingClientRect().y),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.computeSticky();
        })
    );

    this.listenerSubscriptions.push(
      interval(50)
        .pipe(
          map(() => this.doubleStickyScrollElement.nativeElement.scrollLeft),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.stickyScrollElement.nativeElement.scrollLeft = this.doubleStickyScrollElement.nativeElement.scrollLeft;
          this.topStickyScrollElement.nativeElement.scrollLeft = this.doubleStickyScrollElement.nativeElement.scrollLeft;
        })
    );

    this.listenerSubscriptions.push(
      interval(50)
        .pipe(
          map(() => this.stickyScrollElement.nativeElement.scrollLeft),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.doubleStickyScrollElement.nativeElement.scrollLeft = this.stickyScrollElement.nativeElement.scrollLeft;
          this.topStickyScrollElement.nativeElement.scrollLeft = this.stickyScrollElement.nativeElement.scrollLeft;
        })
    );

    this.listenerSubscriptions.push(
      interval(50)
        .pipe(
          map(() => this.topStickyScrollElement.nativeElement.scrollLeft),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.doubleStickyScrollElement.nativeElement.scrollLeft = this.topStickyScrollElement.nativeElement.scrollLeft;
          this.stickyScrollElement.nativeElement.scrollLeft = this.topStickyScrollElement.nativeElement.scrollLeft;
        })
    );
  }

  public doPage(page: number, element: any): void {
    element.value?.next({ page: page, per_page: this.pagination.per_page });
  }

  public doPerPage(perPage: number, element: any): void {
    this.pagination.per_page = perPage;
    this.pagination.page = 1;

    // Update all opened groups with same perPage option
    this.container.groups
      .pipe(
        filter((groups) => groups.type === 'idle'),
        take(1)
      )
      .subscribe((groups) => {
        groups.value.next({ page: 1, per_page: this.pagination.per_page });
        /* const items = groups.value.results?.filter(group => group.open == true);
      for(let item of items){
        item.elements.elements.pipe(
          filter((elements: {type: string, results: any[]}) => elements.type === 'idle'),
          take(1)
        ).subscribe(el => {
          if(el.value?.next){
            el.value?.next({ page: 1, per_page: perPage });
            this.perPageEvent.emit(perPage);
          }
        });
      } */
      });
  }

  private computeSticky(): void {
    if (this.options?.header?.type !== 'sticky' || this.topStickyScrollElement == null || this.stickyScrollElement == null || this.headerElement == null || this.stickyHeaderElement == null) {
      return;
    }

    const rect = this.headerElement.nativeElement.getBoundingClientRect();
    if (rect.y < this.containerResize?.marginTop) {
      if (this.topStickyScrollElement.nativeElement.style.height != null) {
        this.topStickyScrollElement.nativeElement.scrollLeft = this.stickyScrollElement.nativeElement.scrollLeft;

        this.topStickyScrollElement.nativeElement.style.height = null;
      }
    } else {
      if (this.topStickyScrollElement.nativeElement.style.height !== 0) {
        this.topStickyScrollElement.nativeElement.style.height = 0;
      }
    }
  }

  trackColumnByFn(index: number, column: IColumnConfigExt<E>): any {
    return column.key;
  }

  trackByFn(index: number, item: E): any {
    const tb = this.options?.row?.trackBy;
    if (!tb) {
      return item;
    }
    return lodash.isString(tb) ? lodash.get(item, tb) : tb(item, index);
  }

  doShowMenu(button: ElementRef | HTMLElement, item: E, index: number): void {
    forkJoin(
      this.actions.map((a) => {
        const result = a.hidden?.(item, index, a.key) ?? false;
        return (isObservable(result) ? result : of(result)).pipe(
          filter((r) => !r),
          map(() => a)
        );
      })
    )
      .pipe(
        concatMap((actions) =>
          forkJoin(
            actions.map((a) => {
              const result = a.disabled?.(item, index, a.key) ?? false;
              return (isObservable(result) ? result : of(result)).pipe(
                map((r) => ({
                  code: a.key,
                  nameKey: a.nameKey,
                  params: a.params ? a.params(item, index, a.key) : null,
                  icon: lodash.isString(a.icon) ? a.icon : a.icon(item, index, a.key),
                  disabled: r
                }))
              );
            })
          )
        ),
        concatMap((actions) => this.menuDropdownService.chooseOptions(button, actions))
      )
      .subscribe((next) => {
        if (next) {
          const action = this.actions.find((a) => a.key === next);

          if (action.action) {
            action.action(item, index, action.key, button);
          } else if (action.routerLink) {
            const link = action.routerLink(item, index, action.key);
            this.router.navigate(lodash.isString(link) ? [link] : link, {
              queryParams: {
                ...(action.routerQueryParam ? action.routerQueryParam(item, index, action.key) : {})
              },
              state: action.routerState ? action.routerState(item, index, action.key) : null,
              relativeTo: this.route
            });
          }
        }
      });
  }

  doResizeColumn(event: any, column: IColumnConfigExt<E>, th: HTMLElement): void {
    this.pressed = true;
    this.startX = event.pageX;
    this.startWidth = column.resizeWidth || th.clientWidth;

    event.preventDefault();

    this.addListeners(column, th);
  }

  private addListeners(column: IColumnConfigExt<E>, th: HTMLElement): void {
    this.resizableMousemove = this.renderer.listen('document', 'mousemove', (event) => {
      if (this.pressed && event.buttons) {
        const dx = event.pageX - this.startX;
        const width = this.startWidth + dx;

        column.resizeWidth = width;
        th.style.width = `${width}px`;
      }
    });
    this.resizableMouseup = this.renderer.listen('document', 'mouseup', (event) => {
      if (this.pressed) {
        this.pressed = false;
        this.resizableMousemove();
        this.resizableMouseup();

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  doResetWidth(column: IColumnConfigExt<E>, th: HTMLElement): void {
    column.resizeWidth = null;
    th.style.width = column.width ? column.width : 'auto';
    this.changeDetectorRef.detectChanges();
  }

  doToggleSelect(item: E, index: number): void {
    this.selecteds[index] = !this.selecteds[index];

    this.selectEvent.emit({ item, index, select: this.selecteds[index] });

    if (this.propagateChange) {
      this.propagateChange(this.selecteds);
    }

    this.changeDetectorRef.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.selecteds = obj;

      this.changeDetectorRef.detectChanges();
    }
  }

  refresh(): void {
    this.changeDetectorRef.detectChanges();
  }

  doToggleSelectAll(): void {
    if (this.selecteds && this.items && this.items.length > 0 && this.selecteds.length > 0) {
      const n = this.selecteds.filter((b) => b).length;
      const disableds = this.items.map((item, index) => (this.options?.row?.select?.disabled ? this.options?.row?.select?.disabled(item, index) : false));
      const ns = disableds.filter((b) => !b).length;
      if (n === ns) {
        this.items.forEach((item, index) => {
          this.selecteds[index] = false;

          this.selectEvent.emit({ item, index, select: this.selecteds[index] });
        });
      } else {
        this.items.forEach((item, index) => {
          this.selecteds[index] = !disableds[index];

          this.selectEvent.emit({ item, index, select: this.selecteds[index] });
        });
      }

      if (this.propagateChange) {
        this.propagateChange(this.selecteds);
      }

      this.changeDetectorRef.detectChanges();
    }
  }
}
