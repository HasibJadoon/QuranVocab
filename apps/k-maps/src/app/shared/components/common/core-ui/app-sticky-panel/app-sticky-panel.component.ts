import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-sticky-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-sticky-panel.component.html',
  styleUrls: ['./app-sticky-panel.component.scss'],
})
export class AppStickyPanelComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() countLabel = '';
  @Input() sticky = false;
  @Input() stickyTop = '0.75rem';
  @Input() stickyMaxHeight = 'calc(100vh - 1.5rem)';

  @HostBinding('class.is-sticky')
  get isStickyHost(): boolean {
    return this.sticky;
  }

  @HostBinding('style.top')
  get stickyTopStyle(): string | null {
    return this.sticky ? this.stickyTop : null;
  }
}
