import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  CardComponent,
  CardBodyComponent,
  ColComponent,
  RowComponent
} from '@coreui/angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent
  ]
})
export class DashboardComponent {
  readonly sections: DashboardSection[] = [
    {
      id: 'arabic',
      title: 'Arabic',
      cards: [
        {
          id: 'lessons',
          title: 'Lessons',
          description: 'Lesson editor + view',
          route: '/arabic/lessons',
          image: '/assets/images/app-icons/dashboard/card-arabic.svg',
          imageAlt: '/assets/images/app-icons/dashboard/arabic-lesson-card.png',
          theme: 'theme-arabic',
        },
        {
          id: 'roots',
          title: 'Roots',
          description: 'Quranic roots + cards',
          route: '/arabic/roots',
          image: '/assets/images/app-icons/dashboard/card-roots.svg',
          imageAlt: '/assets/images/app-icons/dashboard/arabic-root-card.png',
          theme: 'theme-roots',
        },
        {
          id: 'lexicon',
          title: 'Lexicon',
          description: 'Idioms, poetry, wv_concepts',
          route: '/arabic/lexicon',
          image: '/assets/images/app-icons/dashboard/card-lexicon.svg',
          imageAlt: '/assets/images/app-icons/dashboard/arabic-lexicon-card.png',
          theme: 'theme-lexicon',
        },
        {
          id: 'memory',
          title: 'Memory',
          description: 'Spaced review sessions',
          route: '/arabic/memory',
          image: '/assets/images/app-icons/dashboard/card-memory.svg',
          imageAlt: '/assets/images/app-icons/dashboard/arabic-memory-card.png',
          theme: 'theme-memory',
        },
      ],
    },
    {
      id: 'worldview',
      title: 'Worldview',
      cards: [
        {
          id: 'worldview-lessons',
          title: 'Worldview Lessons',
          description: 'Lessons + sources',
          route: '/worldview/lessons',
          image: '/assets/images/app-icons/dashboard/card-worldview.svg',
          imageAlt: '/assets/images/app-icons/dashboard/image.png',
          theme: 'theme-worldview',
        },
      ],
    },
    {
      id: 'crossref',
      title: 'Cross-Reference',
      cards: [
        {
          id: 'cross-references',
          title: 'Cross References',
          description: 'Quran vs other sources',
          route: '/crossref',
          image: '/assets/images/app-icons/dashboard/card-crossref.svg',
          imageAlt: '/assets/images/app-icons/dashboard/icons.webp',
          theme: 'theme-crossref',
        },
      ],
    },
    {
      id: 'podcast',
      title: 'Podcast',
      cards: [
        {
          id: 'podcast',
          title: 'Podcast',
          description: 'Episodes + outlines',
          route: '/podcast',
          image: '/assets/images/app-icons/dashboard/card-podcast.svg',
          imageAlt: '/assets/images/app-icons/dashboard/vue.jpg',
          theme: 'theme-podcast',
        },
      ],
    },
    {
      id: 'planner',
      title: 'Planner',
      cards: [
        {
          id: 'weekly-planner',
          title: 'Weekly Planner',
          description: 'Plans + tasks',
          route: '/planner',
          image: '/assets/images/app-icons/dashboard/card-planner.svg',
          imageAlt: '/assets/images/app-icons/dashboard/react.jpg',
          theme: 'theme-planner',
        },
      ],
    },
  ];

  constructor(private router: Router) {}

  go(path: string) {
    this.router.navigate([path]);
  }

  trackBySection(_: number, section: DashboardSection) {
    return section.id;
  }

  trackByCard(_: number, card: DashboardCard) {
    return card.id;
  }
}

interface DashboardSection {
  id: string;
  title: string;
  cards: DashboardCard[];
}

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  route: string;
  image: string;
  imageAlt?: string;
  theme:
    | 'theme-arabic'
    | 'theme-roots'
    | 'theme-lexicon'
    | 'theme-memory'
    | 'theme-worldview'
    | 'theme-crossref'
    | 'theme-podcast'
    | 'theme-planner';
}
