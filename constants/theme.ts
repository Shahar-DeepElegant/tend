/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

import { GardenColors, GardenFonts } from '@/constants/design-system';

export const Colors = {
  light: {
    text: GardenColors.forest,
    background: GardenColors.cream,
    tint: GardenColors.sage,
    icon: GardenColors.stone,
    tabIconDefault: GardenColors.stone,
    tabIconSelected: GardenColors.sage,
    card: GardenColors.white,
    border: GardenColors.border,
    muted: GardenColors.stone,
    accent: GardenColors.terracotta,
  },
  dark: {
    text: '#EAF2E8',
    background: '#182117',
    tint: '#8EB48B',
    icon: '#9CA79D',
    tabIconDefault: '#9CA79D',
    tabIconSelected: '#D9EED7',
    card: '#202B1F',
    border: '#2E3B2D',
    muted: '#A7B3A8',
    accent: '#E69A7A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: GardenFonts.ui,
    serif: GardenFonts.body,
    rounded: GardenFonts.ui,
    mono: 'ui-monospace',
    display: GardenFonts.display,
    bodySemibold: GardenFonts.bodySemibold,
    uiBold: GardenFonts.uiBold,
  },
  default: {
    sans: GardenFonts.ui,
    serif: GardenFonts.body,
    rounded: GardenFonts.ui,
    mono: 'monospace',
    display: GardenFonts.display,
    bodySemibold: GardenFonts.bodySemibold,
    uiBold: GardenFonts.uiBold,
  },
  web: {
    sans: GardenFonts.ui,
    serif: GardenFonts.body,
    rounded: GardenFonts.ui,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    display: GardenFonts.display,
    bodySemibold: GardenFonts.bodySemibold,
    uiBold: GardenFonts.uiBold,
  },
});
