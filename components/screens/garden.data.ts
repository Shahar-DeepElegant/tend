import type { ImageSourcePropType } from 'react-native';

export type GroveRing = 'inner' | 'mid' | 'outer';

export type GroveContact = {
  id: string;
  name: string;
  ring: GroveRing;
  left: number;
  top: number;
  image: ImageSourcePropType;
  needsWater?: boolean;
};

export const groveContacts: GroveContact[] = [
  { id: 'inner-1', name: 'Sarah', ring: 'inner', left: 16, top: 25, image: require('@/assets/stitch/garden/images/grove-img-01.jpg'), needsWater: true },
  { id: 'inner-2', name: 'Maya', ring: 'inner', left: 95, top: 50, image: require('@/assets/stitch/garden/images/grove-img-02.jpg') },
  { id: 'inner-3', name: 'Leo', ring: 'inner', left: 50, top: 96, image: require('@/assets/stitch/garden/images/grove-img-03.jpg') },
  { id: 'inner-4', name: 'Nina', ring: 'inner', left: 8, top: 56, image: require('@/assets/stitch/garden/images/grove-img-12.jpg') },
  { id: 'inner-5', name: 'Omar', ring: 'inner', left: 62, top: 6, image: require('@/assets/stitch/garden/images/grove-img-11.jpg') },
  { id: 'mid-1', name: 'Ava', ring: 'mid', left: 11, top: 70, image: require('@/assets/stitch/garden/images/grove-img-04.jpg') },
  { id: 'mid-2', name: 'Jules', ring: 'mid', left: 90, top: 20, image: require('@/assets/stitch/garden/images/grove-img-05.jpg') },
  { id: 'mid-3', name: 'Noah', ring: 'mid', left: 75, top: 95, image: require('@/assets/stitch/garden/images/grove-img-06.jpg') },
  { id: 'mid-4', name: 'Rina', ring: 'mid', left: 40, top: 1, image: require('@/assets/stitch/garden/images/grove-img-07.jpg') },
  { id: 'mid-5', name: 'Tariq', ring: 'mid', left: 7, top: 28, image: require('@/assets/stitch/garden/images/grove-img-10.jpg') },
  { id: 'mid-6', name: 'Mina', ring: 'mid', left: 60, top: 2, image: require('@/assets/stitch/garden/images/grove-img-09.jpg') },
  { id: 'mid-7', name: 'Jae', ring: 'mid', left: 93, top: 62, image: require('@/assets/stitch/garden/images/grove-img-08.jpg') },
  { id: 'outer-1', name: 'Cam', ring: 'outer', left: 50, top: 0, image: require('@/assets/stitch/garden/images/grove-img-08.jpg') },
  { id: 'outer-2', name: 'Priya', ring: 'outer', left: 5, top: 40, image: require('@/assets/stitch/garden/images/grove-img-09.jpg') },
  { id: 'outer-3', name: 'Nick', ring: 'outer', left: 95, top: 70, image: require('@/assets/stitch/garden/images/grove-img-10.jpg') },
  { id: 'outer-4', name: 'Eli', ring: 'outer', left: 20, top: 90, image: require('@/assets/stitch/garden/images/grove-img-11.jpg') },
  { id: 'outer-5', name: 'Sana', ring: 'outer', left: 8, top: 70, image: require('@/assets/stitch/garden/images/grove-img-01.jpg') },
  { id: 'outer-6', name: 'Kai', ring: 'outer', left: 70, top: 94, image: require('@/assets/stitch/garden/images/grove-img-02.jpg') },
  { id: 'outer-7', name: 'Ravi', ring: 'outer', left: 90, top: 35, image: require('@/assets/stitch/garden/images/grove-img-03.jpg') },
  { id: 'outer-8', name: 'Ivy', ring: 'outer', left: 28, top: 6, image: require('@/assets/stitch/garden/images/grove-img-04.jpg') },
];

export const highlightedContact = {
  name: 'Sarah Jenkins',
  subtitle: 'Last watered 2 days ago',
  image: require('@/assets/stitch/garden/images/grove-img-12.jpg'),
  ring: 'Inner',
};

