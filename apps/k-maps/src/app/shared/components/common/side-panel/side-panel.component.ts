import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'mcit-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss']
})
export class McitSidePanelComponent implements OnInit {
  @Input()
  selectedItems$: Observable<{
    [key: string]: {
      value: any;
    };
  }>;

  @Output() panelToggled = new EventEmitter<boolean>();
  public showPanel = true;
  private readonly unsubscribeAll$: Subject<void> = new Subject();
  noItemsSelected$ = new BehaviorSubject<boolean>(false);

  ngOnInit(): void {
    this.initSelectItemsSubs();
  }

  initSelectItemsSubs() {
    this.selectedItems$
      .pipe(
        takeUntil(this.unsubscribeAll$),
        tap((e) => {
          this.noItemsSelected$.next(Object.keys(e).length === 0);
          this.panelToggled.emit(!this.noItemsSelected$.value);

          if (!this.noItemsSelected$.value && !this.showPanel) {
            this.showPanel = true;
          }
        })
      )
      .subscribe();
  }

  doTogglePanel() {
    this.showPanel = !this.showPanel;
    this.panelToggled.emit(this.showPanel);
  }
}
