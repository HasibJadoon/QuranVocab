import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare let ResizeSensor;

export interface IResize {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
}

@Injectable({
  providedIn: 'root'
})
export class McitContainerService {
  private elementRef: ElementRef;
  private resizeSubject = new BehaviorSubject<IResize>(null);
  private sensor: any;
  private callback: any;

  constructor() {
    this.callback = (ds) => {
      const style = this.elementRef.nativeElement.currentStyle || window.getComputedStyle(this.elementRef.nativeElement);

      const marginTop = style.marginTop && style.marginTop.indexOf('px') > 0 ? Number(style.marginTop.substring(0, style.marginTop.length - 2)) : 0;
      const marginBottom = style.marginBottom && style.marginBottom.indexOf('px') > 0 ? Number(style.marginBottom.substring(0, style.marginBottom.length - 2)) : 0;

      this.resizeSubject.next({
        width: ds.width,
        height: ds.height,
        marginTop,
        marginBottom
      });
    };
  }

  registerContainer(elementRef: ElementRef): void {
    if (this.sensor) {
      this.sensor.detach(this.callback);
      this.sensor = null;
    }
    this.elementRef = elementRef;

    this.resizeSubject.next(null);

    this.sensor = new ResizeSensor(elementRef.nativeElement, this.callback);
  }

  unregisterContainer(elementRef: ElementRef): void {
    if (this.elementRef === elementRef) {
      this.elementRef = null;
      this.resizeSubject.next(null);

      if (this.sensor) {
        this.sensor.detach(this.callback);
        this.sensor = null;
      }
    }
  }

  getContainer(): ElementRef {
    return this.elementRef;
  }

  resize$(): Observable<IResize> {
    return this.resizeSubject.asObservable();
  }
}
