import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'mcit-simple-accordion',
  templateUrl: './simple-accordion.component.html',
  styleUrls: ['./simple-accordion.component.scss']
})
export class McitSimpleAccordionComponent implements OnInit {
  @Input()
  open = true;
  @Input()
  sticky = false;
  @Input()
  useHeight = false;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('stickyTop')
  set allowDay(value: string) {
    if (!value) {
      value = '0';
    }
    document.documentElement.style.setProperty('--top', value + this.unit);
  }

  @Input()
  unit = 'px';
  @Input()
  zIndex = 1020;
  @Input()
  isGrid = false;
  @Input()
  disabled = false;

  @Output()
  openEvent = new EventEmitter<boolean>();

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    document.documentElement.style.setProperty('--zindex', this.zIndex.toString());
  }

  doToggleOpen(): void {
    this.open = !this.open;

    this.openEvent.emit(this.open);

    this.changeDetectorRef.detectChanges();
  }

  doOpen(): void {
    if (this.open) {
      return;
    }

    this.open = true;

    this.openEvent.emit(this.open);

    this.changeDetectorRef.detectChanges();
  }

  doClose(): void {
    if (!this.open) {
      return;
    }

    this.open = false;

    this.openEvent.emit(this.open);

    this.changeDetectorRef.detectChanges();
  }
}
