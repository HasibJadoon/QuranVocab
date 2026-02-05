import { Component, ElementRef, ViewChild, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-barcode',
  templateUrl: './barcode.component.html',
  styleUrls: ['./barcode.component.scss']
})
export class BarcodeComponent implements AfterViewInit, OnChanges {
  @ViewChild('svg', { static: true }) svg!: ElementRef<SVGSVGElement>;

  /** Text to encode */
  @Input() value = '';

  /** CODE128 / CODE128C (auto-selected if not specified) */
  @Input() format: 'CODE128' | 'CODE128C' | '' = '';

  /** Bar thickness (px) */
  @Input() width = 2;

  /** Barcode height (px) */
  @Input() height = 100;

  /** Show human-readable text below */
  @Input() displayValue = true;

  /** Outer margin (px) */
  @Input() margin = 10;

  /** Bar color */
  @Input() lineColor = '#000';

  /** Background color (use 'transparent' for no background) */
  @Input() background = 'transparent';

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.render();
  }

  private render(): void {
    const el = this.svg?.nativeElement;
    if (!el || !this.value) {
      if (el) el.innerHTML = '';
      return;
    }

    const chosenFormat = this.format || this.pickCode128Variant(this.value); // CODE128C si aplica

    try {
      JsBarcode(el, this.value, {
        format: chosenFormat,
        width: this.width,
        height: this.height,
        displayValue: this.displayValue,
        lineColor: this.lineColor,
        margin: this.margin,
        background: this.background,
        valid: (ok) => {
          if (!ok) el.innerHTML = '';
        }
      });
    } catch {
      el.innerHTML = '';
    }
  }

  /** If it's numeric and has even length, use CODE128C (more compact) */
  private pickCode128Variant(v: string): 'CODE128' | 'CODE128C' {
    return /^\d+$/.test(v) && v.length % 2 === 0 ? 'CODE128C' : 'CODE128';
  }
}
