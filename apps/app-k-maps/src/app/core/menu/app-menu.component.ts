import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class AppMenuComponent {
  private openSections = new Set<string>(['arabic']);

  constructor(
    private readonly router: Router, 
    private readonly menu: MenuController
  ) {}

  async go(url: string) {
    // 1. Close menu first to ensure smooth transition
    await this.menu.close('main-menu');
    // 2. Then navigate
    await this.router.navigateByUrl(url);
  }

  toggle(section: string) {
    if (this.openSections.has(section)) {
      this.openSections.delete(section);
    } else {
      this.openSections.add(section);
    }
  }

  isOpen(section: string) {
    return this.openSections.has(section);
  }
}
