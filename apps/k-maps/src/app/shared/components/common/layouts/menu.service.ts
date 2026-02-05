import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { McitCoreConfig } from '../helpers/provider.helper';

export interface McitMenuInfoUser {
  firstname: string;
  lastname: string;
  description: string;
  local?: boolean;
}

export interface McitMenuItem {
  title: string;
  icon: string;
  link: string;
  disable?: boolean;
  hide?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class McitMenuService {
  private infoUserSubject: Subject<McitMenuInfoUser> = new BehaviorSubject<McitMenuInfoUser>(null);
  private avatarSubject: Subject<Blob> = new BehaviorSubject<Blob>(null);
  private items: McitMenuItem[];
  private itemsSubject: Subject<McitMenuItem[]>;

  constructor(private config: McitCoreConfig) {
    this.items = this.config.defaultMenus;
    this.itemsSubject = new BehaviorSubject<McitMenuItem[]>(this.items);
  }

  infoUser(infoUser: McitMenuInfoUser): void {
    this.infoUserSubject.next(infoUser);
  }

  infoUser$(): Observable<McitMenuInfoUser> {
    return this.infoUserSubject.asObservable();
  }

  avatar(avatar: Blob): void {
    this.avatarSubject.next(avatar);
  }

  avatar$(): Observable<Blob> {
    return this.avatarSubject.asObservable();
  }

  items$(): Observable<McitMenuItem[]> {
    return this.itemsSubject.asObservable();
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
