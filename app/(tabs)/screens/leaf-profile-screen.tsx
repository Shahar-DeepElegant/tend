import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius, GardenSpacing } from '@/constants/design-system';

import { growthRings, leafProfile, type GrowthRingType } from './leaf-profile.data';

const ringIconByType: Record<GrowthRingType, keyof typeof MaterialIcons.glyphMap> = {
  coffee: 'local-cafe',
  call: 'call',
  text: 'chat-bubble',
};

export function LeafProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topAction} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color={GardenColors.sage} />
        </Pressable>
        <Pressable style={styles.topAction}>
          <MaterialIcons name="edit" size={22} color={GardenColors.sage} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            <Image source={leafProfile.avatarUrl} style={styles.avatar} />
          </View>
          <View style={styles.statusBadge}>
            <MaterialIcons name="eco" size={18} color="#7A9D78" />
          </View>

          <GardenText variant="title" style={styles.name}>
            {leafProfile.name}
          </GardenText>
          <View style={styles.relationPill}>
            <GardenText variant="button" color="#3A5D38">
              {leafProfile.relation}
            </GardenText>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction}>
            <MaterialIcons name="call" size={20} color="#3A5D38" />
            <GardenText variant="meta" color="#3A5D38">
              Call
            </GardenText>
          </Pressable>
          <Pressable style={styles.quickAction}>
            <MaterialIcons name="chat-bubble" size={20} color="#3A5D38" />
            <GardenText variant="meta" color="#3A5D38">
              Message
            </GardenText>
          </Pressable>
          <Pressable style={styles.quickActionPrimary} onPress={() => router.push('/watering')}>
            <MaterialIcons name="water-drop" size={20} color={GardenColors.white} />
            <GardenText variant="meta" color={GardenColors.white}>
              Log Water
            </GardenText>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <GardenText variant="meta" color="#5A7D58">
              LAST SPOKE
            </GardenText>
            <GardenText variant="section" style={styles.statValue}>
              {leafProfile.lastSpoke}
            </GardenText>
          </View>
          <View style={styles.statCard}>
            <GardenText variant="meta" color="#5A7D58">
              STREAK
            </GardenText>
            <GardenText variant="section" style={styles.statValue}>
              {leafProfile.streak}
            </GardenText>
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleLeft}>
            <View style={styles.scheduleIcon}>
              <MaterialIcons name="autorenew" size={22} color={GardenColors.sage} />
            </View>
            <View>
              <GardenText variant="section" style={styles.scheduleTitle}>
                {leafProfile.cadence}
              </GardenText>
              <GardenText variant="meta" color="#5A7D58">
                Next: {leafProfile.nextReminder}
              </GardenText>
            </View>
          </View>
          <Pressable style={styles.expandButton}>
            <MaterialIcons name="expand-more" size={20} color="#6D7B6C" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="psychology-alt" size={20} color={GardenColors.sage} />
            <GardenText variant="section" style={styles.sectionTitle}>
              The Soil
            </GardenText>
          </View>
          <View style={styles.noteCard}>
            <Pressable style={styles.noteEdit}>
              <MaterialIcons name="edit" size={14} color="#3A5D38" />
            </Pressable>
            <GardenText variant="body" style={styles.noteText} color="#4A554A">
              {leafProfile.soilNote}
            </GardenText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history-edu" size={20} color={GardenColors.sage} />
            <GardenText variant="section" style={styles.sectionTitle}>
              Growth Rings
            </GardenText>
          </View>
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {growthRings.map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, item.highlighted ? styles.timelineDotActive : null]}>
                  <MaterialIcons
                    name={ringIconByType[item.type]}
                    size={14}
                    color={item.highlighted ? GardenColors.white : GardenColors.sage}
                  />
                </View>
                <View style={styles.timelineBody}>
                  <View style={styles.timelineHeader}>
                    <GardenText variant="body" style={styles.timelineTitle}>
                      {item.title}
                    </GardenText>
                    <GardenText variant="meta" color="#5A7D58">
                      {item.date}
                    </GardenText>
                  </View>
                  <GardenText variant="meta" color="#5A655A">
                    {item.note}
                  </GardenText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/watering')}>
        <MaterialIcons name="water-drop" size={32} color={GardenColors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GardenColors.cream,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    paddingBottom: 6,
    backgroundColor: 'rgba(249,247,242,0.92)',
  },
  topAction: {
    width: 40,
    height: 40,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: GardenSpacing.md,
    paddingBottom: 120,
    gap: GardenSpacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  avatarGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: GardenRadius.chip,
    backgroundColor: 'rgba(122,157,120,0.2)',
    top: -4,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: GardenRadius.chip,
    borderWidth: 4,
    borderColor: GardenColors.white,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    right: 2,
    top: 98,
    width: 32,
    height: 32,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 6,
    fontSize: 36,
    lineHeight: 40,
    color: '#1E2B1F',
  },
  relationPill: {
    borderRadius: GardenRadius.chip,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#E8F0E8',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(90,125,88,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: GardenColors.white,
  },
  quickActionPrimary: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: GardenColors.sage,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: 'rgba(90,125,88,0.1)',
    borderRadius: 24,
    padding: GardenSpacing.md,
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 32,
    color: '#1E2B1F',
  },
  scheduleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(90,125,88,0.1)',
    backgroundColor: GardenColors.white,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: '#1E2B1F',
  },
  expandButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: '#1E2B1F',
  },
  noteCard: {
    position: 'relative',
    borderRadius: 24,
    backgroundColor: '#F2EFE9',
    borderWidth: 1,
    borderColor: 'rgba(90,125,88,0.05)',
    padding: GardenSpacing.md,
    paddingTop: 22,
  },
  noteEdit: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 30,
    height: 30,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  noteText: {
    fontStyle: 'italic',
  },
  timeline: {
    position: 'relative',
    paddingLeft: 6,
    gap: GardenSpacing.md,
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(90,125,88,0.2)',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: GardenRadius.chip,
    borderWidth: 2,
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: 2,
  },
  timelineDotActive: {
    backgroundColor: GardenColors.sage,
  },
  timelineBody: {
    flex: 1,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineTitle: {
    fontSize: 19,
    color: '#1E2B1F',
  },
  fab: {
    position: 'absolute',
    right: GardenSpacing.md,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GardenColors.sage,
    shadowColor: GardenColors.sage,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
  },
});

