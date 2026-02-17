import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  AppHeaderbarComponent,
  AppMenuCardsComponent,
  AppMenuCardItem,
  AppMenuCardSection,
} from '../../../../shared/components';

@Component({
  selector: 'app-lexicon-menu',
  standalone: true,
  imports: [CommonModule, AppHeaderbarComponent, AppMenuCardsComponent],
  templateUrl: './lexicon-menu.component.html',
  styleUrls: ['./lexicon-menu.component.scss'],
})
export class LexiconMenuComponent {
  readonly sections: AppMenuCardSection[] = [
    {
      id: 'lexicon-main',
      title: 'Lexicon Workspace',
      cards: [
        {
          id: 'lexicon-roots',
          title: 'Roots',
          description: 'Root registry and root cards.',
          route: ['/arabic/lexicon/roots'],
          image: 'assets/images/app-icons/dashboard/card-roots.svg',
          imageAlt: 'assets/images/app-icons/dashboard/arabic-root-card.png',
          themeClass: 'theme-roots',
        },
        {
          id: 'lexicon-entry',
          title: 'Lexicon',
          description: 'Lexicon desk with sources, chunks, evidence, and surah mapping.',
          route: ['/arabic/lexicon/entry'],
          image: 'assets/images/app-icons/dashboard/card-lexicon.svg',
          imageAlt: 'assets/images/app-icons/dashboard/arabic-lexicon-card.png',
          themeClass: 'theme-lexicon',
        },
        {
          id: 'lexicon-books',
          title: 'Books / Chunks',
          description: 'View source chunks and run search across selected or all sources.',
          route: ['/arabic/lexicon/books'],
          image: 'assets/images/app-icons/dashboard/card-crossref.svg',
          imageAlt: 'assets/images/app-icons/dashboard/icons.webp',
          themeClass: 'theme-crossref',
        },
      ],
    },
  ];

  constructor(private readonly router: Router) {}

  onCardSelect(card: AppMenuCardItem): void {
    if (!card.route) return;
    const route = Array.isArray(card.route) ? card.route : [card.route];
    this.router.navigate(route);
  }
}
