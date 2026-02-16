import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GardenCard, GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenFonts, GardenRadius, GardenSpacing } from '@/constants/design-system';

import { seedContacts } from '../up-next.data';

type Step = 1 | 2;
type Circle = 'Inner Circle' | 'Mid Circle' | 'Outer Circle';

const cadenceByCircle: Record<Circle, string> = {
  'Inner Circle': 'Every 1-2 weeks',
  'Mid Circle': 'Every month',
  'Outer Circle': 'Every 3-6 months',
};

type AddContactModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddContactModal({ visible, onClose }: AddContactModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [circleById, setCircleById] = useState<Record<string, Circle>>({});

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setQuery('');
      setSelectedIds([]);
      setCircleById({});
    }
  }, [visible]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seedContacts;
    return seedContacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const selectedContacts = seedContacts.filter((c) => selectedIds.includes(c.id));

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

          {step === 1 ? (
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
                {filteredContacts.map((contact) => {
                  const selected = selectedIds.includes(contact.id);
                  return (
                    <Pressable
                      key={contact.id}
                      style={[styles.contactRow, selected ? styles.contactRowSelected : null]}
                      onPress={() => toggleSelected(contact.id)}>
                      <View style={styles.contactLeft}>
                        {contact.image ? (
                          <Image source={contact.image} style={styles.contactAvatar} />
                        ) : (
                          <View style={styles.contactInitials}>
                            <GardenText variant="button" color={GardenColors.sage}>
                              {contact.initials}
                            </GardenText>
                          </View>
                        )}
                        <View>
                          <GardenText variant="body">{contact.name}</GardenText>
                          <GardenText variant="meta">
                            {contact.label} - {contact.phone}
                          </GardenText>
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

          {step === 2 ? (
            <View style={styles.stepBody}>
              <GardenText variant="section">Where should these seeds grow?</GardenText>
              <GardenText variant="meta">Assign each friend to a circle and set reminder cadence.</GardenText>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.seedPacketList}>
                {selectedContacts.map((contact) => {
                  const activeCircle = circleById[contact.id] ?? 'Mid Circle';
                  return (
                    <GardenCard key={contact.id} style={styles.seedPacket}>
                      <View style={styles.contactLeft}>
                        {contact.image ? (
                          <Image source={contact.image} style={styles.contactAvatar} />
                        ) : (
                          <View style={styles.contactInitials}>
                            <GardenText variant="button" color={GardenColors.sage}>
                              {contact.initials}
                            </GardenText>
                          </View>
                        )}
                        <View>
                          <GardenText variant="meta" color={GardenColors.sage}>
                            Seed Packet
                          </GardenText>
                          <GardenText variant="body">{contact.name}</GardenText>
                        </View>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.circlePicker}>
                        {(['Inner Circle', 'Mid Circle', 'Outer Circle'] as Circle[]).map((circle) => (
                          <Pressable
                            key={circle}
                            onPress={() => setCircleById((current) => ({ ...current, [contact.id]: circle }))}
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
              <Pressable onPress={onClose} style={styles.cta}>
                <GardenText variant="button" color={GardenColors.white}>
                  Add Seeds to Garden
                </GardenText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
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
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contactInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F1E8',
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
