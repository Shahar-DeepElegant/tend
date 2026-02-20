import type { ImageSourcePropType } from 'react-native';

export type ReminderCard = {
  id: string;
  name: string;
  lastSpoke: string;
  overdue?: boolean;
  image?: ImageSourcePropType;
  initials?: string;
};

export type ReminderSection = {
  title: string;
  items: ReminderCard[];
};

export type SeedContact = {
  id: string;
  name: string;
  phone: string;
  label: 'Mobile' | 'Home' | 'Work';
  image?: ImageSourcePropType;
  initials?: string;
};

export const initialSections: ReminderSection[] = [
  {
    title: 'Needs Water',
    items: [
      {
        id: 'sarah',
        name: 'Sarah Miller',
        lastSpoke: 'Last spoke: 3 months ago',
        overdue: true,
        image: require('@/assets/stitch/up-next/images/img-01.jpg'),
      },
    ],
  },
  {
    title: 'Today',
    items: [
      {
        id: 'dad',
        name: 'Dad',
        lastSpoke: 'Last spoke: 1 week ago',
        image: require('@/assets/stitch/up-next/images/img-02.jpg'),
      },
      {
        id: 'maya',
        name: 'Maya (College)',
        lastSpoke: 'Last spoke: 2 months ago',
        image: require('@/assets/stitch/up-next/images/img-03.jpg'),
      },
    ],
  },
  {
    title: 'This Week',
    items: [{ id: 'alex', name: 'Alex (Work)', lastSpoke: 'Last spoke: 2 weeks ago', initials: 'A' }],
  },
  {
    title: 'Later',
    items: [],
  },
];

export const seedContacts: SeedContact[] = [
  {
    id: 'alice',
    name: 'Alice Freeman',
    label: 'Mobile',
    phone: '+1 (555) 012-3456',
    image: require('@/assets/stitch/seedling/images/seedling-img-01.jpg'),
  },
  {
    id: 'arthur',
    name: 'Arthur Dent',
    label: 'Home',
    phone: '+1 (555) 098-7654',
    image: require('@/assets/stitch/seedling/images/seedling-img-02.jpg'),
  },
  {
    id: 'bella',
    name: 'Bella Swan',
    label: 'Mobile',
    phone: '+1 (555) 123-4567',
    image: require('@/assets/stitch/seedling/images/seedling-img-03.jpg'),
  },
  {
    id: 'ben',
    name: 'Ben Wyatt',
    label: 'Work',
    phone: '+1 (555) 222-3333',
    initials: 'B',
  },
  {
    id: 'charlie',
    name: 'Charlie Kelly',
    label: 'Mobile',
    phone: '+1 (555) 999-8888',
    image: require('@/assets/stitch/seedling/images/seedling-img-04.jpg'),
  },
];
