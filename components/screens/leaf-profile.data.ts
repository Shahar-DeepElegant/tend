export type GrowthRingType = 'coffee' | 'call' | 'text';

export type GrowthRingEntry = {
  id: string;
  type: GrowthRingType;
  title: string;
  date: string;
  note: string;
  highlighted?: boolean;
};

export const leafProfile = {
  name: 'Sarah Jenkins',
  relation: 'College Friend',
  lastSpoke: '3 days ago',
  streak: '4 months',
  cadence: 'Every 2 weeks',
  nextReminder: 'Oct 24 (Tuesday)',
  soilNote:
    '"Sarah loves Earl Grey tea (extra hot). Her son Leo just started kindergarten. Remember to ask about her pottery class next time."',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAnteBJF8IRgTsshFjKyWXlXIUiBgZlTUDaxYvok7Cmvy_T2gA4tK_OoL0MRtEStkx7GOUlg07YuBn_0b3LtI8bFg33gHi5qs63M4rlsCTrfyyDP-c7L-oIy_Vx2w6FGVsFGltmNKHfBVd_dPQCFjGIQXhzj-bnIh81uY4pODb7Fo8Opkop8jJK9Y7A3vStpzAxS3II7Ryyo1nK8dDpQBrNIxRkoVkwmxnnMGgC3pQZlL9cKQLU4RwXhuwvUuc9VF1OnsE82Vwwc6bJ',
};

export const growthRings: GrowthRingEntry[] = [
  {
    id: 'ring-1',
    type: 'coffee',
    title: 'Coffee Catch-up',
    date: 'Oct 12',
    note: "Met at the downtown cafe. She's really enjoying her new role at the agency.",
    highlighted: true,
  },
  {
    id: 'ring-2',
    type: 'call',
    title: 'Quick Call',
    date: 'Sept 28',
    note: 'Called to wish her luck on the presentation.',
  },
  {
    id: 'ring-3',
    type: 'text',
    title: 'Text Check-in',
    date: 'Sept 14',
    note: 'Sent a meme about gardening.',
  },
];
