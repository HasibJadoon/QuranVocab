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

  constructor(private readonly router: Router, private readonly menu: MenuController) {}

  async go(url: string) {
    await this.menu.close();
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

