import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type ProfileToggleId = 'fuzzyReminders' | 'automaticLogMode';

type ProfileRowBase = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

type ProfileChevronRow = ProfileRowBase & {
  type: 'chevron';
};

type ProfileToggleRow = ProfileRowBase & {
  type: 'toggle';
  toggleId: ProfileToggleId;
};

type ProfileStatusRow = ProfileRowBase & {
  type: 'status';
  status: string;
};

export type ProfileRow = ProfileChevronRow | ProfileToggleRow | ProfileStatusRow;

export type ProfileSection = {
  id: string;
  title: string;
  rows: ProfileRow[];
};

export const profileHeader = {
  title: 'Settings',
  subtitle: 'Cultivate your digital sanctuary',
  avatar: require('@/assets/stitch/profile/images/settings-img-01.jpg'),
};

export const profileSections: ProfileSection[] = [
  {
    id: 'garden-structure',
    title: 'Garden Structure',
    rows: [
      {
        id: 'custom-circles',
        type: 'chevron',
        icon: 'psychology-alt',
        title: 'Define Custom Circles',
        subtitle: 'Inner, Mid, Outer and custom layers',
      },
    ],
  },
  {
    id: 'nurturing-controls',
    title: 'Nurturing Controls',
    rows: [
      {
        id: 'reminder-frequency',
        type: 'chevron',
        icon: 'water-drop',
        title: 'Reminder Frequency',
        subtitle: 'How often your garden needs care',
      },
      {
        id: 'fuzzy-reminders',
        type: 'toggle',
        toggleId: 'fuzzyReminders',
        icon: 'filter-vintage',
        title: 'Fuzzy Reminders',
        subtitle: 'Natural, non-rigid notifications',
      },
    ],
  },
  {
    id: 'interaction-logging',
    title: 'Interaction Logging',
    rows: [
      {
        id: 'automatic-log-mode',
        type: 'toggle',
        toggleId: 'automaticLogMode',
        icon: 'edit-note',
        title: 'Automatic Log Mode',
        subtitle: 'Detect calls and messages',
      },
      {
        id: 'notification-detection',
        type: 'status',
        icon: 'notifications-active',
        title: 'Notification Detection',
        subtitle: 'Required for automatic logging',
        status: 'Enabled',
      },
    ],
  },
];

export const profileActions = [
  {
    id: 'backup',
    icon: 'cloud-upload',
    title: 'Backup',
    subtitle: 'Google Drive',
    tone: 'blue' as const,
  },
  {
    id: 'export',
    icon: 'feed',
    title: 'Export',
    subtitle: 'CSV Format',
    tone: 'orange' as const,
  },
];
