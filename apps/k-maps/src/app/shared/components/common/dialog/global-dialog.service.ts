import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class McitGlobalDialog {
  private readonly dialogs: any[] = [];
  private readonly dialogChangedSubject = new Subject<void>();

  private isBodyOverflowing = false;
  private originalBodyPadding = 0;
  private scrollbarWidth = 0;
  private _renderer: Renderer2;
  private scrollbar = 0;

  constructor(private router: Router, private location: Location, private rendererFactory: RendererFactory2) {
    this.location.subscribe(() => {
      if (this.dialogs.length > 0) {
        while (this.dialogs.length > 0) {
          this.dialogs.pop()();
        }
      }
    });

    this._renderer = rendererFactory.createRenderer(null, null);
  }

  registerOtherModal(callback): void {
    this.dialogs.push(callback);
    this.dialogChangedSubject.next();
  }

  unregisterOtherModal(callback): void {
    const i = this.dialogs.indexOf(callback);
    if (i >= 0) {
      this.dialogs.splice(i, 1);
    }
    this.dialogChangedSubject.next();
  }

  getModalCounts(): number {
    return this.dialogs.length;
  }

  hideLastModal(): void {
    if (this.dialogs.length > 0) {
      this.dialogs.pop()();
    }
  }

  dialogChanged(): Observable<void> {
    return this.dialogChangedSubject.asObservable();
  }

  private checkScrollbar(): void {
    this.isBodyOverflowing = document.body.clientWidth < window.innerWidth;
    this.scrollbarWidth = this.getScrollbarWidth();
  }

  setScrollbar(): void {
    if (!document) {
      return;
    }

    this.scrollbar++;
    if (this.scrollbar > 1) {
      return;
    }
    this.scrollbar = 1;

    this.checkScrollbar();

    this.originalBodyPadding = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right') || '0', 10);

    if (this.isBodyOverflowing) {
      document.body.style.paddingRight = `${this.originalBodyPadding + this.scrollbarWidth}px`;
    }

    this._renderer.addClass(document.body, 'modal-open');
  }

  resetScrollbar(): void {
    this.scrollbar--;
    if (this.scrollbar > 0) {
      return;
    }
    this.scrollbar = 0;
    document.body.style.paddingRight = `${this.originalBodyPadding}px`;

    this._renderer.removeClass(document.body, 'modal-open');
  }

  // thx d.walsh
  private getScrollbarWidth(): number {
    const scrollDiv = this._renderer.createElement('div');
    this._renderer.addClass(scrollDiv, 'modal-scrollbar-measure');
    this._renderer.appendChild(document.body, scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this._renderer.removeChild(document.body, scrollDiv);

    return scrollbarWidth;
  }
}
