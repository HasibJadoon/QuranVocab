import { AfterViewInit, Component, ElementRef, HostBinding, HostListener, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'mcit-pinch-zoom, [mcit-pinch-zoom]',
  templateUrl: './pinch-zoom.component.html'
})
export class McitPinchZoomComponent implements OnInit, AfterViewInit {
  private elem: any;
  private parentElem: any;
  private eventType: any;

  scale: any = 1;

  private initialScale: any = 1;

  private startX: any;
  private startY: any;

  private moveX: any = 0;
  private moveY: any = 0;
  private initialMoveX: any = 0;
  private initialMoveY: any = 0;

  private moveXC: any;
  private moveYC: any;

  private distance: any;
  private initialDistance: any;

  private tagName: string;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('height') containerHeight: string;

  @HostBinding('style.display') hostDisplay: string;
  @HostBinding('style.overflow') hostOverflow: string;
  @HostBinding('style.height') hostHeight: string;

  @ViewChild('content', { static: true }) contentEl: ElementRef;

  constructor(private elementRef: ElementRef) {
    this.tagName = this.elementRef.nativeElement.tagName.toLowerCase();
  }

  ngOnInit(): void {
    this.elem = this.contentEl.nativeElement;
    this.parentElem = this.elem.parentNode;
  }

  ngAfterViewInit(): void {
    this.setBasicStyles();
  }

  reset(): void {
    this.initialScale = this.scale = 1;
    this.initialMoveX = this.moveX = 0;
    this.initialMoveY = this.moveY = 0;

    this.transformElem(200);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.transformElem(200);
  }

  @HostListener('touchstart', ['$event'])
  touchstartHandler(event) {
    this.elem.style.transformOrigin = '0 0';
  }

  @HostListener('touchmove', ['$event'])
  touchmoveHandler(event) {
    const touches = event.touches;

    // Swipe
    if ((touches.length === 1 && this.scale > 1 && !this.eventType) || this.eventType === 'swipe') {
      event.preventDefault();

      if (!this.eventType) {
        this.startX = event.touches[0].pageX;
        this.startY = event.touches[0].pageY;
      }

      this.eventType = 'swipe';

      this.moveX = this.initialMoveX + (event.touches[0].pageX - this.startX);
      this.moveY = this.initialMoveY + (event.touches[0].pageY - this.startY);

      this.transformElem(0);
    }

    // Pinch
    if ((touches.length === 2 && !this.eventType) || this.eventType === 'pinch') {
      event.preventDefault();

      if (!this.eventType) {
        this.initialDistance = this.getDistance(touches);

        this.moveXC = (event.touches[0].pageX + event.touches[1].pageX) / 2 - this.initialMoveX;
        this.moveYC = (event.touches[0].pageY + event.touches[1].pageY) / 2 - this.initialMoveY;
      }

      this.eventType = 'pinch';
      this.distance = this.getDistance(touches);
      this.scale = this.initialScale * (this.distance / this.initialDistance);

      this.moveX = this.initialMoveX - ((this.distance / this.initialDistance) * this.moveXC - this.moveXC);
      this.moveY = this.initialMoveY - ((this.distance / this.initialDistance) * this.moveYC - this.moveYC);

      this.transformElem(0);
    }
  }

  @HostListener('touchend', ['$event'])
  touchendHandler(event) {
    const touches = event.touches;
    const img = this.elem.getElementsByTagName('img')[0];

    if (this.scale < 1) {
      this.scale = 1;
    }

    if (this.moveY > 0) {
      this.moveY = 0;
    }

    if (img && this.scale > 1) {
      const imgHeight = this.getImageHeight();
      const imgWidth = this.getImageWidth();
      const imgOffsetTop = ((imgHeight - this.elem.offsetHeight) * this.scale) / 2;
      if (imgHeight * this.scale < this.parentElem.offsetHeight) {
        this.moveY = ((this.parentElem.offsetHeight - this.elem.offsetHeight) * this.scale) / 2;
      } else if (imgWidth * this.scale < this.parentElem.offsetWidth) {
        this.moveX = ((this.parentElem.offsetWidth - this.elem.offsetWidth) * this.scale) / 2;
      } else if (this.eventType === 'swipe') {
        if (this.moveY > imgOffsetTop) {
          this.moveY = imgOffsetTop;
        } else if (imgHeight * this.scale + Math.abs(imgOffsetTop) - this.parentElem.offsetHeight + this.moveY < 0) {
          this.moveY = -(imgHeight * this.scale + Math.abs(imgOffsetTop) - this.parentElem.offsetHeight);
        }
      }
    }

    if (this.moveX > 0) {
      this.moveX = 0;
    } else if (this.moveX < this.elem.offsetWidth * (1 - this.scale)) {
      this.moveX = this.elem.offsetWidth * (1 - this.scale);
    }

    this.initialScale = this.scale;
    this.initialMoveX = this.moveX;
    this.initialMoveY = this.moveY;

    this.transformElem(200);

    this.eventType = 'touchend';
    if (touches.length === 0) {
      this.eventType = '';
    }
  }

  private getDistance(touches: any) {
    return Math.sqrt(Math.pow(touches[0].pageX - touches[1].pageX, 2) + Math.pow(touches[0].pageY - touches[1].pageY, 2));
  }

  private getImageHeight() {
    return this.elem.getElementsByTagName('img')[0].offsetHeight;
  }

  private getImageWidth() {
    return this.elem.getElementsByTagName('img')[0].offsetWidth;
  }

  private setBasicStyles(): void {
    this.elem.style.display = 'flex';
    this.elem.style.height = '100%';
    this.elem.style.alignItems = 'center';
    this.elem.style.justifyContent = 'center';

    this.hostDisplay = 'block';
    this.hostOverflow = 'hidden';
    this.hostHeight = this.containerHeight;

    this.setImageWidth();
  }

  private setImageWidth(): void {
    const imgElem = this.elem.getElementsByTagName('img');
    if (imgElem.length) {
      for (const elm of imgElem) {
        elm.style.maxWidth = '100%';
        elm.style.maxHeight = '100%';
      }
    }
  }

  private transformElem(duration: any = 50): void {
    this.elem.style.transition = 'all ' + duration + 'ms';
    this.elem.style.transform = 'matrix(' + Number(this.scale) + ',' + 0 + ',' + 0 + ',' + Number(this.scale) + ',' + Number(this.moveX) + ',' + Number(this.moveY) + ')';
  }
}
