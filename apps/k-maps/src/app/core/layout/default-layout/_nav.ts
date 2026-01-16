import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cilHome' }
  },
  {
    name: 'Arabic',
    iconComponent: { name: 'cilBookmark' },
    children: [
      {
        name: 'Lessons',
        url: '/arabic/lessons',
        iconComponent: { name: 'cilBookmark' }
      },
      {
        name: 'Roots',
        url: '/arabic/roots',
        iconComponent: { name: 'cilList' }
      },
      {
        name: 'Lexicon',
        url: '/arabic/lexicon',
        iconComponent: { name: 'cilDescription' }
      },
      {
        name: 'Memory',
        url: '/arabic/memory',
        iconComponent: { name: 'cilTask' }
      }
    ]
  },
  {
    name: 'Worldview',
    iconComponent: { name: 'cilMap' },
    children: [
      {
        name: 'Lessons',
        url: '/worldview/lessons',
        iconComponent: { name: 'cilMap' }
      }
    ]
  },
  {
    name: 'Crossref',
    iconComponent: { name: 'cilShareAll' },
    children: [
      {
        name: 'Cross References',
        url: '/crossref',
        iconComponent: { name: 'cilShareAll' }
      }
    ]
  },
  {
    name: 'Podcast',
    iconComponent: { name: 'cilMediaPlay' },
    children: [
      {
        name: 'Episodes',
        url: '/podcast',
        iconComponent: { name: 'cilMediaPlay' }
      }
    ]
  },
  {
    name: 'Planner',
    iconComponent: { name: 'cilCalendar' },
    children: [
      {
        name: 'Weekly Plan',
        url: '/planner',
        iconComponent: { name: 'cilCalendar' }
      }
    ]
  }
];
