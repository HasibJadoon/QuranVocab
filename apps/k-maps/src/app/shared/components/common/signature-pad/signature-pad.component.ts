import { AfterContentInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import SignaturePad, { PointGroup } from 'signature_pad';

@Component({
  selector: 'mcit-signature-pad',
  template: '<canvas></canvas>'
})
export class McitSignaturePadComponent implements AfterContentInit, OnDestroy {
  @Input() public options: object;
  // eslint-disable-next-line  @angular-eslint/no-output-native
  @Output() public beginEvent: EventEmitter<boolean>;
  // eslint-disable-next-line  @angular-eslint/no-output-native
  @Output() public endEvent: EventEmitter<boolean>;

  private signaturePad: SignaturePad;
  private canvas: HTMLCanvasElement;
  private elementRef: ElementRef;

  constructor(elementRef: ElementRef) {
    // no op
    this.elementRef = elementRef;
    this.options = this.options || {};
    this.beginEvent = new EventEmitter();
    this.endEvent = new EventEmitter();
  }

  public ngAfterContentInit(): void {
    this.canvas = this.elementRef.nativeElement.querySelector('canvas');

    if ((<any>this.options)['canvasHeight']) {
      this.canvas.height = (<any>this.options)['canvasHeight'];
    }

    if ((<any>this.options)['canvasWidth']) {
      this.canvas.width = (<any>this.options)['canvasWidth'];
    }

    this.signaturePad = new SignaturePad(this.canvas, this.options);
    this.signaturePad.addEventListener('beginStroke', () => this.onBegin());
    this.signaturePad.addEventListener('endStroke', () => this.onEnd());
  }

  ngOnDestroy(): void {
    this.signaturePad.off();
  }

  public resizeCanvas(): void {
    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    const ratio: number = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = this.canvas.offsetWidth * ratio;
    this.canvas.height = this.canvas.offsetHeight * ratio;
    this.canvas.getContext('2d').scale(ratio, ratio);
    this.signaturePad.clear(); // otherwise isEmpty() might return incorrect value
  }

  // Returns signature image as an array of point groups
  public toData(): Array<PointGroup> {
    return this.signaturePad.toData();
  }

  // Draws signature image from an array of point groups
  public fromData(points: Array<PointGroup>): void {
    this.signaturePad.fromData(points);
  }

  // Returns signature image as data URL (see https://mdn.io/todataurl for the list of possible paramters)
  public toDataURL(imageType?: string, quality?: number): string {
    return this.signaturePad.toDataURL(imageType, quality); // save image as data URL
  }

  // Draws signature image from data URL
  public fromDataURL(dataURL: string, options: object = {}): void {
    this.signaturePad.fromDataURL(dataURL, options);
  }

  // Clears the canvas
  public clear(): void {
    this.signaturePad.clear();
  }

  // Returns true if canvas is empty, otherwise returns false
  public isEmpty(): boolean {
    return this.signaturePad.isEmpty();
  }

  // Unbinds all event handlers
  public off(): void {
    this.signaturePad.off();
  }

  // Rebinds all event handlers
  public on(): void {
    this.signaturePad.on();
  }

  // set an option on the signaturePad - e.g. set('minWidth', 50);
  public set(option: string, value: any): void {
    switch (option) {
      case 'canvasHeight':
        this.canvas.height = value;
        break;
      case 'canvasWidth':
        this.canvas.width = value;
        break;
      default:
        this.signaturePad[option] = value;
    }
  }

  // notify subscribers on signature begin
  public onBegin(): void {
    this.beginEvent.emit(true);
  }

  // notify subscribers on signature end
  public onEnd(): void {
    this.endEvent.emit(true);
  }

  public queryPad(): any {
    return this.signaturePad;
  }

  public drawImage(img: HTMLImageElement): void {
    const sw = img.width;
    const sh = img.height;
    this.canvas.getContext('2d').drawImage(img, (this.canvas.width - sw) / 2, (this.canvas.height - sh) / 2);
  }
}
