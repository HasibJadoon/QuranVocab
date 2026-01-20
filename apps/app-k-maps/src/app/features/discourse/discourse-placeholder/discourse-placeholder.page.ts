import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-discourse-placeholder',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './discourse-placeholder.page.html',
  styleUrls: ['./discourse-placeholder.page.scss'],
})
export class DiscoursePlaceholderPage {
  title = 'Discourse';
  subtitle = 'Coming soon.';

  constructor(private readonly route: ActivatedRoute) {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? this.title;
    this.subtitle = data['subtitle'] ?? this.subtitle;
  }
}
