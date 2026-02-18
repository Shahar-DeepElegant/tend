import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GardenCard, GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenFonts, GardenRadius, GardenSpacing } from '@/constants/design-system';
import { canImportContactsOnCurrentPlatform, listImportContacts, type ImportContact } from '@/lib/contacts/provider';
import { upsertContact } from '@/lib/db';
import type { CircleId } from '@/lib/db';

type Step = 1 | 2;
type Circle = 'Inner Circle' | 'Mid Circle' | 'Outer Circle';

const cadenceByCircle: Record<Circle, string> = {
  'Inner Circle': 'Every 1-2 weeks',
  'Mid Circle': 'Every month',
  'Outer Circle': 'Every 3-6 months',
};

const circleByLabel: Record<Circle, CircleId> = {
  'Inner Circle': 'inner',
  'Mid Circle': 'mid',
  'Outer Circle': 'outer',
};

type AddContactModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

export function AddContactModal({ visible, onClose, onAdded }: AddContactModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [circleById, setCircleById] = useState<Record<string, Circle>>({});
  const [sourceContacts, setSourceContacts] = useState<ImportContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [saving, setSaving] = useState(false);
  const canImport = canImportContactsOnCurrentPlatform();

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setQuery('');
      setSelectedIds([]);
      setCircleById({});
      return;
    }

    let cancelled = false;
    setLoadingContacts(true);
    listImportContacts('')
      .then((contacts) => {
        if (cancelled) return;
        setSourceContacts(contacts);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingContacts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoadingContacts(true);
    listImportContacts(query)
      .then((contacts) => {
        if (!cancelled) setSourceContacts(contacts);
      })
      .finally(() => {
        if (!cancelled) setLoadingContacts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, visible]);

  const selectedContacts = useMemo(
    () => sourceContacts.filter((contact) => selectedIds.includes(contact.systemId)),
    [sourceContacts, selectedIds]
  );

  const toggleSelected = (id: string) => {
    const alreadySelected = selectedIds.includes(id);
    if (alreadySelected) {
      setSelectedIds((current) => current.filter((itemId) => itemId !== id));
      setCircleById((existing) => {
        const next = { ...existing };
        delete next[id];
        return next;
      });
      return;
    }

    setSelectedIds((current) => [...current, id]);
    setCircleById((existing) => ({ ...existing, [id]: existing[id] ?? 'Mid Circle' }));
  };

  const handleAddSeeds = async () => {
    if (selectedContacts.length === 0) return;
    setSaving(true);
    try {
      for (const contact of selectedContacts) {
        const selectedCircle = circleById[contact.systemId] ?? 'Mid Circle';
        await upsertContact({
          systemId: contact.systemId,
          fullName: contact.fullName,
          nickName: contact.nickName,
          imageUri: contact.imageUri,
          description: null,
          circleId: circleByLabel[selectedCircle],
          customReminderDays: null,
        });
      }
      onAdded?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} style={styles.backBtn}>
              <MaterialIcons name="close" size={22} color={GardenColors.forest} />
            </Pressable>
            <View style={styles.stepDots}>
              {[1, 2].map((s) => (
                <View key={s} style={[styles.stepDot, s <= step ? styles.stepDotActive : null]} />
              ))}
            </View>
            <GardenText variant="meta" color={GardenColors.sage}>
              Step {step}/2
            </GardenText>
          </View>

          {!canImport ? (
            <View style={styles.stepBody}>
              <GardenText variant="section">Import not available on web</GardenText>
              <GardenText variant="meta">
                Set `EXPO_PUBLIC_MOCK_CONTACTS_ON_WEB=true` to mock contact source while still using SQLite.
              </GardenText>
            </View>
          ) : null}

          {canImport && step === 1 ? (
            <View style={styles.stepBody}>
              <GardenText variant="section">Who would you like to plant?</GardenText>
              <GardenText variant="meta">Select friends to add to your garden.</GardenText>
              <View style={styles.searchWrap}>
                <MaterialIcons name="search" size={20} color={GardenColors.stone} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search contacts..."
                  placeholderTextColor={GardenColors.stone}
                  style={styles.searchInput}
                />
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contactsList}>
                {loadingContacts ? (
                  <GardenText variant="meta" color={GardenColors.stone}>
                    Loading contacts...
                  </GardenText>
                ) : null}
                {!loadingContacts && sourceContacts.length === 0 ? (
                  <GardenText variant="meta" color={GardenColors.stone}>
                    No contacts found.
                  </GardenText>
                ) : null}
                {sourceContacts.map((contact) => {
                  const selected = selectedIds.includes(contact.systemId);
                  return (
                    <Pressable
                      key={contact.systemId}
                      style={[styles.contactRow, selected ? styles.contactRowSelected : null]}
                      onPress={() => toggleSelected(contact.systemId)}>
                      <View style={styles.contactLeft}>
                        {contact.imageUri ? (
                          <Image source={contact.imageUri} style={styles.contactAvatar} />
                        ) : (
                          <View style={styles.contactInitials}>
                            <GardenText variant="button" color={GardenColors.sage}>
                              {initialsFromName(contact.fullName)}
                            </GardenText>
                          </View>
                        )}
                        <View>
                          <GardenText variant="body">{contact.fullName}</GardenText>
                          <GardenText variant="meta">{contact.nickName || 'Contact'}</GardenText>
                        </View>
                      </View>
                      <View style={[styles.checkbox, selected ? styles.checkboxSelected : null]}>
                        {selected ? <MaterialIcons name="check" size={16} color="#fff" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                disabled={selectedIds.length === 0}
                onPress={() => setStep(2)}
                style={[styles.cta, selectedIds.length === 0 ? styles.ctaDisabled : null]}>
                <GardenText variant="button" color={GardenColors.white}>
                  Continue to Planting
                </GardenText>
              </Pressable>
            </View>
          ) : null}

          {canImport && step === 2 ? (
            <View style={styles.stepBody}>
              <GardenText variant="section">Where should these seeds grow?</GardenText>
              <GardenText variant="meta">Assign each friend to a circle and set reminder cadence.</GardenText>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.seedPacketList}>
                {selectedContacts.map((contact) => {
                  const activeCircle = circleById[contact.systemId] ?? 'Mid Circle';
                  return (
                    <GardenCard key={contact.systemId} style={styles.seedPacket}>
                      <View style={styles.contactLeft}>
                        {contact.imageUri ? (
                          <Image source={contact.imageUri} style={styles.contactAvatar} />
                        ) : (
                          <View style={styles.contactInitials}>
                            <GardenText variant="button" color={GardenColors.sage}>
                              {initialsFromName(contact.fullName)}
                            </GardenText>
                          </View>
                        )}
                        <View>
                          <GardenText variant="meta" color={GardenColors.sage}>
                            Seed Packet
                          </GardenText>
                          <GardenText variant="body">{contact.fullName}</GardenText>
                        </View>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.circlePicker}>
                        {(['Inner Circle', 'Mid Circle', 'Outer Circle'] as Circle[]).map((circle) => (
                          <Pressable
                            key={circle}
                            onPress={() => setCircleById((current) => ({ ...current, [contact.systemId]: circle }))}
                            style={[styles.circleChip, activeCircle === circle ? styles.circleChipActive : null]}>
                            <GardenText
                              variant="meta"
                              color={activeCircle === circle ? GardenColors.white : GardenColors.forest}>
                              {circle}
                            </GardenText>
                          </Pressable>
                        ))}
                      </ScrollView>
                      <View style={styles.cadenceRow}>
                        <MaterialIcons name="schedule" size={16} color={GardenColors.stone} />
                        <GardenText variant="meta">{cadenceByCircle[activeCircle]}</GardenText>
                      </View>
                    </GardenCard>
                  );
                })}
              </ScrollView>
              <Pressable onPress={handleAddSeeds} style={[styles.cta, saving ? styles.ctaDisabled : null]} disabled={saving}>
                <GardenText variant="button" color={GardenColors.white}>
                  {saving ? 'Adding...' : 'Add Seeds to Garden'}
                </GardenText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 54, 43, 0.34)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%',
    minHeight: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: GardenColors.cream,
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    paddingBottom: GardenSpacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: GardenSpacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: GardenColors.border,
  },
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DCE8DB',
  },
  stepDotActive: {
    width: 20,
    borderRadius: 8,
    backgroundColor: GardenColors.sage,
  },
  stepBody: {
    flex: 1,
    gap: GardenSpacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GardenSpacing.xs,
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: 16,
    backgroundColor: GardenColors.white,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: GardenColors.forest,
    fontFamily: GardenFonts.ui,
    fontSize: 16,
  },
  contactsList: {
    gap: 10,
    paddingBottom: GardenSpacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
    borderRadius: 18,
    padding: 12,
  },
  contactRowSelected: {
    borderColor: GardenColors.sage,
    backgroundColor: '#EFF5EE',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GardenSpacing.sm,
  },
  contactInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F1E8',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C2CEC2',
  },
  checkboxSelected: {
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.sage,
    height: 52,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  seedPacketList: {
    gap: GardenSpacing.sm,
    paddingBottom: GardenSpacing.sm,
  },
  seedPacket: {
    gap: GardenSpacing.sm,
  },
  circlePicker: {
    gap: 8,
  },
  circleChip: {
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: GardenRadius.chip,
    backgroundColor: GardenColors.cream,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  circleChipActive: {
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.sage,
  },
  cadenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
