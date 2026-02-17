import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';

import { GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius, GardenSpacing } from '@/constants/design-system';

import { interactionOptions, type WateringInteraction, wateringProfile } from './watering.data';

export function WateringScreen() {
  const [interaction, setInteraction] = useState<WateringInteraction>('coffee');
  const [notes, setNotes] = useState('');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Image source={wateringProfile.avatarUrl} style={styles.avatar} />
            <View style={styles.avatarBadge}>
              <MaterialIcons name="water-drop" size={15} color={GardenColors.white} />
            </View>
          </View>
          <GardenText variant="title" style={styles.title}>
            Watering {wateringProfile.name}
          </GardenText>
          <GardenText variant="meta">Last watered {wateringProfile.lastWatered}</GardenText>
        </View>

        <View style={styles.section}>
          <GardenText variant="meta" style={styles.sectionMeta}>
            INTERACTION TYPE
          </GardenText>
          <View style={styles.optionRow}>
            {interactionOptions.map((option) => {
              const active = option.id === interaction;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setInteraction(option.id)}
                  style={[styles.optionButton, active ? styles.optionButtonActive : null]}>
                  <MaterialIcons
                    name={option.icon}
                    size={28}
                    color={active ? GardenColors.white : GardenColors.sage}
                  />
                  <GardenText variant="button" color={active ? GardenColors.white : GardenColors.sage}>
                    {option.label}
                  </GardenText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <MaterialIcons name="edit-note" size={20} color={GardenColors.sage} />
              <GardenText variant="section" style={styles.notesTitle}>
                The Soil
              </GardenText>
            </View>
            <TextInput
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              placeholder="What did you talk about? Add a memory to help you reconnect next time..."
              placeholderTextColor="#97A299"
              style={styles.input}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Pressable style={styles.submitButton}>
          <MaterialIcons name="potted-plant" size={20} color={GardenColors.white} />
          <GardenText variant="button" color={GardenColors.white}>
            Nurture Relationship
          </GardenText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAE6DB',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: GardenColors.cream,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    paddingBottom: GardenSpacing.xl,
    gap: GardenSpacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 50,
    height: 6,
    borderRadius: GardenRadius.chip,
    backgroundColor: '#C6CDC4',
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    marginBottom: 4,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: GardenRadius.chip,
    borderWidth: 3,
    borderColor: GardenColors.white,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GardenColors.sage,
    borderWidth: 2,
    borderColor: GardenColors.white,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
  },
  section: {
    gap: GardenSpacing.sm,
  },
  sectionMeta: {
    paddingHorizontal: 4,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minHeight: 82,
    borderRadius: GardenRadius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
  },
  optionButtonActive: {
    backgroundColor: GardenColors.sage,
    borderColor: GardenColors.sage,
  },
  notesCard: {
    borderRadius: GardenRadius.card,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
    padding: GardenSpacing.md,
    gap: GardenSpacing.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  input: {
    minHeight: 88,
    fontFamily: 'Karla_500Medium',
    color: GardenColors.forest,
    fontSize: 16,
    lineHeight: 22,
  },
  submitButton: {
    marginTop: GardenSpacing.sm,
    borderRadius: GardenRadius.chip,
    height: 56,
    backgroundColor: GardenColors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
