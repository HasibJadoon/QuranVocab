import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitCarouselComponent } from './carousel.component';
import { McitCarouselItemDirective } from './carousel-item.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [McitCarouselComponent, McitCarouselItemDirective],
  exports: [McitCarouselComponent, McitCarouselItemDirective]
})
export class McitCarouselModule {}
