import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MAX_PAGES, PER_PAGE, PER_PAGES } from '../helpers/pagination.helper';
import { McitMenuDropdownService } from '../menu-dropdown/menu-dropdown.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { interval, Subscription } from 'rxjs';
import { IResize, McitContainerService } from '../layouts/container.service';
import * as lodash from 'lodash';
import { distinctUntilChanged, map } from 'rxjs/operators';

export interface IOptions {
  page?: number;
  per_page?: number;
  total?: number;
  totalPages?: number;
  numPages?: number;
  showPerPageSelector?: boolean;
  showNumPageSelector?: boolean;
  per_pages?: number[];
  small?: boolean;
  sticky?: boolean;
}

const DEFAULT_OPTIONS: IOptions = {
  per_page: PER_PAGE,
  numPages: MAX_PAGES,
  showPerPageSelector: true,
  showNumPageSelector: true,
  per_pages: PER_PAGES,
  small: false,
  sticky: false
};

@Component({
  selector: 'mcit-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class McitPaginationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stickyPagination', { static: true })
  stickyPaginationElement: ElementRef;
  @ViewChild('pagination', { static: true })
  paginationElement: ElementRef;

  private _options: IOptions = DEFAULT_OPTIONS;

  @Input()
  set options(options: IOptions) {
    this._options = lodash.defaultsDeep(options, DEFAULT_OPTIONS);
    this.updatePage();
  }

  get options(): IOptions {
    return this._options;
  }

  @Output()
  pageEvent = new EventEmitter<number>();
  @Output()
  perPageEvent = new EventEmitter<number>();

  numMin: number;
  numMax: number;
  pages: number[];

  infMd = true;

  private containerResize: IResize;
  private subscriptions: Subscription[] = [];

  constructor(private menuDropdownService: McitMenuDropdownService, private breakpointObserver: BreakpointObserver, private changeDetectorRef: ChangeDetectorRef, private containerService: McitContainerService) {}

  ngOnInit(): void {
    if (this.breakpointObserver.isMatched('(min-width: 768px)')) {
      this.infMd = false;
      this.updatePage();
    } else {
      this.infMd = true;
      this.updatePage();
    }

    this.subscriptions.push(
      this.breakpointObserver.observe(['(min-width: 768px)']).subscribe((next) => {
        if (next.breakpoints['(min-width: 768px)']) {
          this.infMd = false;
          this.updatePage();
        } else {
          this.infMd = true;
          this.updatePage();
        }
      })
    );

    this.stickyPaginationElement.nativeElement.style.display = 'none';

    this.subscriptions.push(
      this.containerService.resize$().subscribe((next) => {
        this.stickyPaginationElement.nativeElement.style.bottom = next?.marginBottom + 'px';

        this.containerResize = next;
        this.computeSticky();
      })
    );
    this.subscriptions.push(
      interval(50)
        .pipe(
          map(() => this.paginationElement.nativeElement.getBoundingClientRect().y),
          distinctUntilChanged()
        )
        .subscribe((next) => {
          this.computeSticky();
        })
    );
  }

  ngAfterViewInit(): void {
    this.computeSticky();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private computeSticky(): void {
    if (!this.options?.sticky || !this.containerResize) {
      return;
    }
    const rect = this.paginationElement.nativeElement.getBoundingClientRect();

    if (rect.y > this.containerResize.height + this.containerResize.marginTop + this.containerResize.marginBottom) {
      this.stickyPaginationElement.nativeElement.style.display = null;
    } else {
      this.stickyPaginationElement.nativeElement.style.display = 'none';
    }
  }

  private updatePage(): void {
    const np = this.infMd ? 3 : this.options?.numPages;

    const pos = (this.options?.page - 1) * this.options?.per_page + 1;
    const posMax = pos + this.options?.per_page - 1;
    this.numMin = pos;
    this.numMax = posMax <= this.options?.total ? posMax : pos > this.options?.total ? pos : this.options?.total;

    // Dans le cas où on ne connait le nombre réel total
    if (this.options?.totalPages === -1) {
      const m = Math.floor(np / 2);
      let start: number;
      if (this.options?.page <= m) {
        start = 1;
      } else {
        start = Math.max(1, this.options?.page - m);
      }
      const max = this.options?.page + 2;

      this.pages = [];
      for (let i = start; i < max; i++) {
        this.pages.push(i);
      }
    } else {
      const m = Math.floor(np / 2);
      let start: number;
      if (this.options?.page <= m) {
        start = 1;
      } else if (this.options?.page >= this.options?.totalPages - m) {
        start = Math.max(1, this.options?.totalPages - np + 1);
      } else {
        start = Math.max(1, this.options?.page - m);
      }

      this.pages = [];
      const max = Math.min(this.options?.totalPages + 1, start + np);

      for (let i = start; i < max; i++) {
        this.pages.push(i);
      }
    }

    this.changeDetectorRef.detectChanges();

    this.computeSticky();
  }

  doPage(page: number): void {
    this.pageEvent.emit(page);
  }

  doChangePerPage(per_page: number): void {
    this.perPageEvent.emit(per_page);
  }

  doShowChangePerPage(button: any): void {
    const options = [];
    for (const pp of this.options?.per_pages) {
      options.push({
        code: `${pp}`,
        nameKey: `${pp}`,
        noTranslate: true
      });
    }
    this.menuDropdownService.chooseOptions(button, options, `${this.options?.per_page}`).subscribe((next) => {
      if (next) {
        this.perPageEvent.emit(Number(next));
      }
    });
  }
}
