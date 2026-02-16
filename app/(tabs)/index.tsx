import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { GardenCard, GardenText, PillButton } from '@/components/ui/garden-primitives';
import { GardenColors, GardenFonts, GardenRadius, GardenSpacing } from '@/constants/design-system';

type ReminderCard = {
  id: string;
  name: string;
  lastSpoke: string;
  overdue?: boolean;
  image?: ImageSourcePropType;
  initials?: string;
};

type ReminderSection = {
  title: string;
  items: ReminderCard[];
};

const sections: ReminderSection[] = [
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

export default function UpNextScreen() {
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const markDone = (id: string) => {
    setDoneIds((current) => [...current, id]);
  };

  const isDone = (id: string) => doneIds.includes(id);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <GardenText variant="meta" style={styles.dateText}>
              Thursday, Oct 24
            </GardenText>
            <GardenText variant="title">Up Next</GardenText>
          </View>
          <View style={styles.statsWrap}>
            <View style={[styles.statCard, styles.statPrimary]}>
              <GardenText variant="section" color={GardenColors.sage}>
                3
              </GardenText>
              <GardenText variant="meta" color={GardenColors.sage}>
                THIRSTY
              </GardenText>
            </View>
            <View style={styles.statCard}>
              <GardenText variant="section">12</GardenText>
              <GardenText variant="meta">THRIVING</GardenText>
            </View>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <GardenText
              variant="section"
              style={[
                styles.sectionTitle,
                section.title === 'Needs Water' ? { color: GardenColors.terracotta } : null,
              ]}>
              {section.title}
            </GardenText>
            {section.items.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyOrb}>
                  <MaterialIcons name="local-florist" size={42} color={GardenColors.sage} />
                </View>
                <GardenText variant="body" style={styles.emptyCopy} color={GardenColors.stone}>
                  Everything is watered and growing.
                </GardenText>
              </View>
            ) : (
              section.items
                .filter((item) => !isDone(item.id))
                .map((item) => (
                  <ReminderRow key={item.id} item={item} onMarkDone={() => markDone(item.id)} />
                ))
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReminderRow({ item, onMarkDone }: { item: ReminderCard; onMarkDone: () => void }) {
  return (
    <Swipeable
      containerStyle={styles.swipeContainer}
      renderLeftActions={() => (
        <View style={[styles.swipeAction, styles.snoozeAction]}>
          <MaterialIcons name="snooze" size={20} color={GardenColors.forest} />
          <GardenText variant="meta" color={GardenColors.forest}>
            Snooze
          </GardenText>
        </View>
      )}
      renderRightActions={() => (
        <Pressable style={[styles.swipeAction, styles.doneAction]} onPress={onMarkDone}>
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <GardenText variant="meta" color="#fff">
            Mark Done
          </GardenText>
        </Pressable>
      )}>
      <GardenCard overdue={item.overdue} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatarWrap}>
            {item.image ? (
              <Image source={item.image} style={styles.avatar} />
            ) : (
              <View style={styles.initialAvatar}>
                <GardenText variant="button" color={GardenColors.sage}>
                  {item.initials}
                </GardenText>
              </View>
            )}
            {item.overdue ? (
              <View style={styles.overdueBadge}>
                <GardenText variant="button" color="#fff">
                  !
                </GardenText>
              </View>
            ) : null}
          </View>
          <View style={styles.copyCol}>
            <GardenText variant="section" style={styles.nameText}>
              {item.name}
            </GardenText>
            <GardenText variant="meta" color={item.overdue ? GardenColors.terracotta : GardenColors.stone}>
              {item.lastSpoke}
            </GardenText>
          </View>
          <PillButton tone={item.overdue ? 'primary' : 'ghost'} onPress={() => {}}>
            <MaterialIcons
              name="water-drop"
              size={22}
              color={item.overdue ? GardenColors.white : GardenColors.sage}
            />
          </PillButton>
        </View>
      </GardenCard>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GardenColors.cream,
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    gap: GardenSpacing.lg,
  },
  header: {
    gap: GardenSpacing.md,
  },
  dateText: {
    fontFamily: GardenFonts.ui,
  },
  statsWrap: {
    flexDirection: 'row',
    gap: GardenSpacing.sm,
  },
  statCard: {
    minWidth: 128,
    borderRadius: GardenRadius.card,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
    padding: GardenSpacing.md,
    gap: 4,
  },
  statPrimary: {
    backgroundColor: '#EBF2EA',
    borderColor: '#D6E5D5',
  },
  section: {
    gap: GardenSpacing.sm,
  },
  sectionTitle: {
    fontStyle: 'italic',
  },
  swipeContainer: {
    borderRadius: GardenRadius.card,
    overflow: 'hidden',
    marginBottom: GardenSpacing.sm,
  },
  swipeAction: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: GardenRadius.card,
  },
  snoozeAction: {
    backgroundColor: '#E6D6A8',
  },
  doneAction: {
    backgroundColor: GardenColors.sage,
  },
  card: {
    paddingVertical: GardenSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GardenSpacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: GardenRadius.chip,
  },
  initialAvatar: {
    width: 56,
    height: 56,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F1E8',
  },
  overdueBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  copyCol: {
    flex: 1,
    gap: 2,
  },
  nameText: {
    fontSize: 22,
    lineHeight: 26,
  },
  emptyState: {
    alignItems: 'center',
    gap: GardenSpacing.sm,
    paddingVertical: GardenSpacing.lg,
  },
  emptyOrb: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F2E8',
  },
  emptyCopy: {
    textAlign: 'center',
    maxWidth: 220,
  },
});
