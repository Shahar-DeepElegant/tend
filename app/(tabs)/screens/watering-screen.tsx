import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';

import { GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius, GardenSpacing } from '@/constants/design-system';
import { getFirstContactId, getLeafProfileData, insertContactLog } from '@/lib/db/repository';
import { clearOverduePersistentIfResolved } from '@/lib/notifications';

import { interactionOptions, type WateringInteraction } from './watering.data';

export function WateringScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId?: string }>();
  const [interaction, setInteraction] = useState<WateringInteraction>('coffee');
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState<{ id: string; name: string; lastSpoke: string; imageUri: string | null }>({
    id: '',
    name: 'Friend',
    lastSpoke: 'Never',
    imageUri: null,
  });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const targetId = typeof params.contactId === 'string' ? params.contactId : await getFirstContactId();
    if (!targetId) {
      setContact({ id: '', name: 'Friend', lastSpoke: 'Never', imageUri: null });
      return;
    }
    const profile = await getLeafProfileData(targetId);
    if (!profile) return;
    setContact({
      id: targetId,
      name: profile.contact.fullName,
      lastSpoke: profile.lastSpokeAt ? formatRelative(profile.lastSpokeAt) : 'Never',
      imageUri: profile.contact.imageUri,
    });
  }, [params.contactId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleSubmit = async () => {
    if (!contact.id || saving) return;
    setSaving(true);
    try {
      const summary = `${interaction}: ${notes.trim() || 'No summary provided.'}`;
      await insertContactLog({ contactSystemId: contact.id, summary });
      await clearOverduePersistentIfResolved();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {contact.imageUri ? (
              <Image source={contact.imageUri} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <GardenText variant="section">{initialsFromName(contact.name)}</GardenText>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <MaterialIcons name="water-drop" size={15} color={GardenColors.white} />
            </View>
          </View>
          <GardenText variant="title" style={styles.title}>
            Watering {contact.name}
          </GardenText>
          <GardenText variant="meta">Last watered {contact.lastSpoke}</GardenText>
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

        <Pressable style={[styles.submitButton, saving ? styles.submitButtonDisabled : null]} onPress={handleSubmit} disabled={saving || !contact.id}>
          <MaterialIcons name="local-florist" size={20} color={GardenColors.white} />
          <GardenText variant="button" color={GardenColors.white}>
            {saving ? 'Saving...' : 'Nurture Relationship'}
          </GardenText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function formatRelative(iso: string) {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(diffDays / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
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
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
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
  submitButtonDisabled: {
    opacity: 0.55,
  },
});
