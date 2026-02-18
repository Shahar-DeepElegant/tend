import { PropsWithChildren } from 'react';
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';

import {
  GardenColors,
  GardenFonts,
  GardenRadius,
  GardenShadow,
  GardenSpacing,
} from '@/constants/design-system';

type GardenTextVariant = 'title' | 'section' | 'body' | 'meta' | 'button';

type GardenTextProps = TextProps & {
  variant?: GardenTextVariant;
  color?: string;
};

export function GardenText({ variant = 'body', style, color, ...props }: GardenTextProps) {
  return <Text style={[styles.textBase, textStyles[variant], color ? { color } : null, style]} {...props} />;
}

type GardenCardProps = PropsWithChildren<{
  overdue?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function GardenCard({ overdue = false, style, children }: GardenCardProps) {
  return <View style={[styles.card, overdue ? styles.cardOverdue : null, style]}>{children}</View>;
}

type PillButtonProps = PressableProps & {
  tone?: 'primary' | 'ghost';
};

export function PillButton({ tone = 'primary', style, children, ...props }: PillButtonProps) {
  const resolvedStyle =
    typeof style === 'function'
      ? (state: PressableStateCallbackType) => [
          styles.pillButton,
          tone === 'primary' ? styles.primaryButton : styles.ghostButton,
          style(state),
        ]
      : [styles.pillButton, tone === 'primary' ? styles.primaryButton : styles.ghostButton, style];

  return (
    <Pressable style={resolvedStyle} {...props}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  textBase: {
    color: GardenColors.forest,
  },
  card: {
    backgroundColor: GardenColors.white,
    borderRadius: GardenRadius.card,
    borderWidth: 1,
    borderColor: GardenColors.border,
    padding: GardenSpacing.md,
    ...GardenShadow.soft,
  },
  cardOverdue: {
    backgroundColor: '#FDF1EC',
    borderColor: '#F2C8B7',
  },
  pillButton: {
    height: 56,
    width: 56,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: GardenColors.sage,
  },
  ghostButton: {
    backgroundColor: '#EBF2EA',
  },
});

const textStyles = StyleSheet.create({
  title: {
    fontFamily: GardenFonts.display,
    fontSize: 36,
    lineHeight: 40,
  },
  section: {
    fontFamily: GardenFonts.bodySemibold,
    fontSize: 23,
    lineHeight: 28,
  },
  body: {
    fontFamily: GardenFonts.body,
    fontSize: 18,
    lineHeight: 24,
  },
  meta: {
    fontFamily: GardenFonts.ui,
    fontSize: 13,
    lineHeight: 16,
    color: GardenColors.stone,
  },
  button: {
    fontFamily: GardenFonts.uiBold,
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
