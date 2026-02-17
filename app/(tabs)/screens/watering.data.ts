import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type WateringInteraction = 'coffee' | 'call' | 'text' | 'email';

export type InteractionOption = {
  id: WateringInteraction;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export const interactionOptions: InteractionOption[] = [
  { id: 'coffee', label: 'Coffee', icon: 'local-cafe' },
  { id: 'call', label: 'Call', icon: 'call' },
  { id: 'text', label: 'Text', icon: 'sms' },
  { id: 'email', label: 'Email', icon: 'mail' },
];

export const reminderCadence = ['1 week', '2 weeks', '1 month'];

export const wateringProfile = {
  name: 'Sarah',
  lastWatered: '3 weeks ago',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBlb1k2K3mdvehgfus9R94aXFSud6R8dclGAEvPVQa93kelwCojggjiCafIcWX2n5Uh5eNdl5G4_c0x70jCiTn_K_26l4nRjRt1Gdn_beu8l2E8fWx-Wens9QN-A6bIUFzadKwJHc5sK1TSgdXHqaryLR3QM7Dfi75XA7M-DYT7z2DASd6TiT6msjpjFRuMzDhlEVzkr5Hr2orMDDk8gVvTwlRu7Hu_uwhy9o16zNUYwg_iq-xxiUerMOtvYEqxmMGnp21bjafnQdw3',
};

