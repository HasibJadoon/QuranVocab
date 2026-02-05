import { Directive, ElementRef, Input, Self } from '@angular/core';

/*
// Palettes de https://flatuicolors.com/palette/defo
const PALETTES = [
  '#fc5c65', '#fd9644', '#fed330', '#26de81', '#2bcbba',
  '#eb3b5a', '#fa8231', '#f7b731', '#20bf6b', '#0fb9b1',
  '#45aaf2', '#4b7bec', '#a55eea', '#d1d8e0', '#778ca3',
  '#2d98da', '#3867d6', '#8854d0', '#a5b1c2', '#4b6584'
];
*/
/*
// Palattes de GitLab
const PALETTES = [
  '#0033CC', '#428BCA', '#44AD8E', '#A8D695', '#5CB85C',
  '#69D100', '#004E00', '#34495E', '#7F8C8D', '#A295D6',
  '#5843AD', '#8E44AD', '#FFECDB', '#AD4363', '#D10069',
  '#CC0033', '#FF0000', '#D9534F', '#D1D100', '#F0AD4E',
  '#AD8D43'
];
*/
// Palattes de Pauline
const PALETTES = ['#C7C8CB', '#ECEBC6', '#FFFAC9', '#FFE9AC', '#F7E8CF', '#EDEDED', '#D7E2CA', '#CAE2D9', '#A8E2DF', '#AAE8CB', '#D7F9F4', '#E4F7FF', '#C9DAE8', '#FFADBC', '#E6B4BD', '#F5C9CF', '#E2C0EA', '#F5C9F1', '#F2E0F4', '#B7BDE7'];

type Mode = 'foreground' | 'background' | 'border';

@Directive({
  selector: '[mcitRandomColor]'
})
export class McitRandomColorDirective {
  @Input('mcitRandomColor')
  set randomColor(randomColor: string) {
    this._randomColor = randomColor;
    this.updateColor();
  }

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mcitRandomColorMode')
  set randomColorMode(mode: Mode) {
    this.mode = mode;
    this.updateColor();
  }

  private _randomColor: string;
  private mode: Mode = 'background';

  constructor(@Self() private element: ElementRef) {}

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  private static contrast(color: string) {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb & 0xff0000) >> 16;
    const g = (rgb & 0xff00) >> 8;
    const b = rgb & 0xff;

    const isBright = (r * 0.299 + g * 0.587 + b * 0.114) / 256;
    return isBright < 0.5 ? '#FFFFFFEE' : '#31394DEE';
  }

  private updateColor(): void {
    const hash = McitRandomColorDirective.hashCode(this._randomColor);
    const color = PALETTES[hash % PALETTES.length];

    switch (this.mode) {
      case 'foreground':
        this.element.nativeElement.style.backgroundColor = McitRandomColorDirective.contrast(color);
        this.element.nativeElement.style.color = color;
        break;
      case 'border':
        const c = McitRandomColorDirective.contrast(color);
        this.element.nativeElement.style.borderColor = color;
        this.element.nativeElement.style.backgroundColor = McitRandomColorDirective.contrast(c);
        this.element.nativeElement.style.color = c;
        break;
      default:
        this.element.nativeElement.style.backgroundColor = color;
        this.element.nativeElement.style.color = McitRandomColorDirective.contrast(color);
        break;
    }
  }
}
