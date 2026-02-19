import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-font-size-controls',
  standalone: true,
  templateUrl: './app-font-size-controls.component.html',
  styleUrls: ['./app-font-size-controls.component.scss'],
})
export class AppFontSizeControlsComponent {
  @Input() ariaLabel = 'Font size controls';
  @Input() decreaseLabel = 'Decrease font size';
  @Input() resetLabel = 'Reset font size';
  @Input() increaseLabel = 'Increase font size';

  @Output() decrease = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() increase = new EventEmitter<void>();

  onDecrease() {
    this.decrease.emit();
  }

  onReset() {
    this.reset.emit();
  }

  onIncrease() {
    this.increase.emit();
  }
}

