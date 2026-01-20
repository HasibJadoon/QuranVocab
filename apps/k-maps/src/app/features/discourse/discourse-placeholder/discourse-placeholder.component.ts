import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-discourse-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discourse-placeholder.component.html',
  styleUrls: ['./discourse-placeholder.component.scss'],
})
export class DiscoursePlaceholderComponent {
  title = 'Discourse';
  subtitle = 'Coming soon.';

  constructor(private readonly route: ActivatedRoute) {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? this.title;
    this.subtitle = data['subtitle'] ?? this.subtitle;
  }
}
