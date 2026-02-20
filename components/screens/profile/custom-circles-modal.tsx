import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { GardenCard, GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius, GardenSpacing } from '@/constants/design-system';

type CircleKey = 'inner' | 'mid' | 'outer';

type CadenceOption = {
  days: number;
  label: string;
  subtitle: string;
};

const cadenceOptions: CadenceOption[] = [
  { days: 7, label: 'Weekly', subtitle: 'For frequent touchpoints' },
  { days: 14, label: 'Every 2 weeks', subtitle: 'Balanced and consistent' },
  { days: 30, label: 'Monthly', subtitle: 'A steady monthly check-in' },
  { days: 90, label: 'Quarterly', subtitle: 'Every 3 months' },
  { days: 180, label: 'Every 6 months', subtitle: 'Low-maintenance rhythm' },
];

const circleConfig: { key: CircleKey; title: string; icon: keyof typeof MaterialIcons.glyphMap; note: string }[] = [
  { key: 'inner', title: 'Inner Circle', icon: 'favorite', note: 'Closest relationships you nurture most often.' },
  { key: 'mid', title: 'Mid Circle', icon: 'filter-vintage', note: 'Important people you keep warm month to month.' },
  { key: 'outer', title: 'Outer Circle', icon: 'public', note: 'Light-touch relationships you revisit over time.' },
];

type CustomCirclesModalProps = {
  visible: boolean;
  onClose: () => void;
  initialCadenceDays: Record<CircleKey, number>;
  onSave: (value: Record<CircleKey, number>) => void;
};

export function CustomCirclesModal({ visible, onClose, initialCadenceDays, onSave }: CustomCirclesModalProps) {
  const [cadenceByCircle, setCadenceByCircle] = useState<Record<CircleKey, number>>(initialCadenceDays);

  useEffect(() => {
    if (visible) {
      setCadenceByCircle(initialCadenceDays);
    }
  }, [initialCadenceDays, visible]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={GardenColors.forest} />
            </Pressable>
            <GardenText variant="section">Custom Circle Defaults</GardenText>
            <View style={styles.placeholder} />
          </View>

          <GardenText variant="meta" style={styles.subtitle} color="#60715F">
            Pick how often new people should be reminded when they are added to each circle.
          </GardenText>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {circleConfig.map((circle) => (
              <GardenCard key={circle.key} style={styles.circleCard}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.iconWrap}>
                    <MaterialIcons name={circle.icon} size={18} color={GardenColors.sage} />
                  </View>
                  <View style={styles.cardCopy}>
                    <GardenText variant="body">{circle.title}</GardenText>
                    <GardenText variant="meta" color="#6A7868">
                      {circle.note}
                    </GardenText>
                  </View>
                </View>

                <View style={styles.chipsRow}>
                  {cadenceOptions.map((option) => {
                    const selected = cadenceByCircle[circle.key] === option.days;
                    return (
                      <Pressable
                        key={option.days}
                        onPress={() => setCadenceByCircle((current) => ({ ...current, [circle.key]: option.days }))}
                        style={[styles.chip, selected ? styles.chipSelected : null]}>
                        <GardenText variant="meta" color={selected ? GardenColors.white : GardenColors.forest}>
                          {option.label}
                        </GardenText>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.activeHint}>
                  <MaterialIcons name="schedule" size={14} color="#6A7868" />
                  <GardenText variant="meta" color="#6A7868">
                    {cadenceOptions.find((option) => option.days === cadenceByCircle[circle.key])?.subtitle}
                  </GardenText>
                </View>
              </GardenCard>
            ))}
          </ScrollView>

          <Pressable
            style={styles.cta}
            onPress={() => {
              onSave(cadenceByCircle);
              onClose();
            }}>
            <GardenText variant="button" color={GardenColors.white}>
              Save Circle Defaults
            </GardenText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44,54,43,0.34)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    minHeight: '72%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: GardenColors.cream,
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    paddingBottom: GardenSpacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: GardenColors.border,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: GardenSpacing.sm,
  },
  content: {
    gap: GardenSpacing.sm,
    paddingBottom: GardenSpacing.sm,
  },
  circleCard: {
    gap: GardenSpacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F2E8',
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.sage,
  },
  activeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cta: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.sage,
    height: 52,
  },
});
