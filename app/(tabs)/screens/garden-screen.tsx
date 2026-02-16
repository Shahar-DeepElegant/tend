import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { GardenCard, GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius, GardenSpacing } from '@/constants/design-system';

export function GardenScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <GardenText variant="title">My Garden</GardenText>
        <GardenText variant="meta">Visual cluster view coming next.</GardenText>

        <GardenCard style={styles.heroCard}>
          <Image source={require('@/assets/stitch/up-next/up-next.screenshot.png')} style={styles.previewImage} />
          <View style={styles.badge}>
            <MaterialIcons name="construction" size={16} color={GardenColors.sage} />
            <GardenText variant="meta" color={GardenColors.sage}>
              In Progress
            </GardenText>
          </View>
          <GardenText variant="body">The Garden canvas screen is queued after Up Next and Seedling flows.</GardenText>
        </GardenCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GardenColors.cream,
  },
  content: {
    gap: GardenSpacing.sm,
    padding: GardenSpacing.md,
  },
  heroCard: {
    gap: GardenSpacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: GardenRadius.card - 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: GardenRadius.chip,
    backgroundColor: '#EBF2EA',
  },
});
