import { Component, ContentChildren, Input, OnInit, QueryList } from '@angular/core';
import { McitCarouselItemDirective } from './carousel-item.directive';

@Component({
  selector: 'mcit-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class McitCarouselComponent implements OnInit {
  @ContentChildren(McitCarouselItemDirective)
  items: QueryList<McitCarouselItemDirective>;

  prevItem: number;
  nextItem: number;

  private currentItemTmp = 0;

  get currentItem(): number {
    return this.currentItemTmp;
  }

  @Input()
  set currentItem(currentItem: number) {
    this.doSetItem(currentItem);
  }

  @Input()
  fade = false;
  @Input()
  fixeHeight = false;

  constructor() {}

  ngOnInit(): void {}

  doPrevItem(): void {
    this.doSetItem(this.currentItemTmp - 1);
  }

  doNextItem(): void {
    this.doSetItem(this.currentItemTmp + 1);
  }

  doSetItem(i: number): void {
    if (this.currentItem === i || i < 0 || i > this.items.length - 1) {
      return;
    }
    if (this.fade) {
      this.prevItem = this.currentItem;
      this.currentItemTmp = i;
    } else {
      this.nextItem = i;
    }
  }

  doDoneTransition(i: number): void {
    if (i === this.nextItem || i === this.prevItem) {
      if (!this.fade) {
        this.currentItemTmp = i;
      }
      this.nextItem = null;
      this.prevItem = null;
    }
  }
}
