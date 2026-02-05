import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { McitCoreConfig } from '../helpers/provider.helper';

export class McitTabMenuItem {
  title?: string;
  icon: string;
  link?: string;
  click?: (element: ElementRef | HTMLElement) => void;
  count?: number;
  disable?: boolean;
  hide?: boolean;
  hideIfBottom?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class McitTabMenuService {
  private items: McitTabMenuItem[];
  private itemsSubject: Subject<McitTabMenuItem[]>;

  constructor(private config: McitCoreConfig) {
    this.items = this.config.defaultTabMenus;
    this.itemsSubject = new BehaviorSubject<McitTabMenuItem[]>(this.items);
  }

  items$(): Observable<McitTabMenuItem[]> {
    return this.itemsSubject.asObservable();
  }

  getCount(menu: number): number {
    return this.items?.[menu]?.count ?? 0;
  }

  count(menu: number, count: number): void {
    this.items[menu].count = count;
    this.itemsSubject.next(this.items);
  }

  enable(menu: number): void {
    this.items[menu].disable = false;
    this.itemsSubject.next(this.items);
  }

  disable(menu: number): void {
    this.items[menu].disable = true;
    this.itemsSubject.next(this.items);
  }

  show(menu: number): void {
    this.items[menu].hide = false;
    this.itemsSubject.next(this.items);
  }

  hide(menu: number): void {
    this.items[menu].hide = true;
    this.itemsSubject.next(this.items);
  }
}
