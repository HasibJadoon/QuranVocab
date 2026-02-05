import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  CardComponent,
  CardBodyComponent,
  ColComponent,
  RowComponent
} from '@coreui/angular';

import { IconComponent } from '@coreui/icons-angular';

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
    ColComponent,
    IconComponent
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
          icon: 'cilBookmark',
          theme: 'theme-arabic',
        },
        {
          id: 'roots',
          title: 'Roots',
          description: 'Quranic roots + cards',
          route: '/arabic/roots',
          icon: 'cilList',
          theme: 'theme-roots',
        },
        {
          id: 'lexicon',
          title: 'Lexicon',
          description: 'Idioms, poetry, wv_concepts',
          route: '/arabic/lexicon',
          icon: 'cilDescription',
          theme: 'theme-lexicon',
        },
        {
          id: 'memory',
          title: 'Memory',
          description: 'Spaced review sessions',
          route: '/arabic/memory',
          icon: 'cilTask',
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
          icon: 'cilMap',
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
          icon: 'cilShareAll',
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
          icon: 'cilMediaPlay',
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
          icon: 'cilCalendar',
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
  icon: string;
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
