import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { DatePicker } from '@/components/ui/DatePicker';
import { GardenCard, GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius, GardenSpacing } from '@/constants/design-system';

const eventLeadOptions = [1, 3, 7, 14];

type ReminderFrequencyModalProps = {
  visible: boolean;
  onClose: () => void;
  initialKeepPersistent: boolean;
  initialReminderTime: string;
  initialContactEventsReminderDays: number;
  onSave: (value: {
    shouldKeepRemindersPersistent: boolean;
    reminderNotificationTime: string;
    contactEventsReminderDays: number;
  }) => void;
};

function parseTime(value: string) {
  const [h, m] = value.split(':').map((part) => Number(part));
  const date = new Date();
  date.setHours(Number.isFinite(h) ? h : 10, Number.isFinite(m) ? m : 0, 0, 0);
  return date;
}

function toTimeText(date: Date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function ReminderFrequencyModal({
  visible,
  onClose,
  initialKeepPersistent,
  initialReminderTime,
  initialContactEventsReminderDays,
  onSave,
}: ReminderFrequencyModalProps) {
  const [keepPersistent, setKeepPersistent] = useState(initialKeepPersistent);
  const [defaultReminderTime, setDefaultReminderTime] = useState<Date>(parseTime(initialReminderTime));
  const [showDefaultTimePicker, setShowDefaultTimePicker] = useState(false);
  const [contactEventsReminderDays, setContactEventsReminderDays] = useState(initialContactEventsReminderDays);

  useEffect(() => {
    if (!visible) return;
    setKeepPersistent(initialKeepPersistent);
    setDefaultReminderTime(parseTime(initialReminderTime));
    setContactEventsReminderDays(initialContactEventsReminderDays);
    setShowDefaultTimePicker(false);
  }, [initialContactEventsReminderDays, initialKeepPersistent, initialReminderTime, visible]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  const onChangeDefaultTime = (nextDate: Date) => {
    setDefaultReminderTime(nextDate);
    if (Platform.OS === 'android') {
      setShowDefaultTimePicker(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={GardenColors.forest} />
            </Pressable>
            <GardenText variant="section">Reminder Frequency</GardenText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <GardenCard style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <GardenText variant="body">Keep reminders persistent</GardenText>
                  <GardenText variant="meta" color="#6A7868">
                    Keep reminding until you log contact.
                  </GardenText>
                </View>
                <Switch
                  value={keepPersistent}
                  onValueChange={setKeepPersistent}
                  trackColor={{ false: '#D9E2D6', true: GardenColors.sage }}
                  thumbColor={GardenColors.white}
                />
              </View>
            </GardenCard>

            <GardenCard style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="schedule" size={18} color={GardenColors.sage} />
                <GardenText variant="body">Default reminder time</GardenText>
              </View>
              <View style={styles.timePickerBlock}>
                <Pressable style={styles.timeTrigger} onPress={() => setShowDefaultTimePicker((current) => !current)}>
                  <GardenText variant="meta" color={GardenColors.forest}>
                    {formatTime(defaultReminderTime)}
                  </GardenText>
                  <MaterialIcons name={showDefaultTimePicker ? 'expand-less' : 'expand-more'} size={20} color={GardenColors.sage} />
                </Pressable>
                {showDefaultTimePicker ? (
                  <View style={styles.pickerWrap}>
                    <DatePicker value={defaultReminderTime} mode="time" onChange={onChangeDefaultTime} />
                    {Platform.OS === 'ios' ? (
                      <Pressable style={styles.pickerDone} onPress={() => setShowDefaultTimePicker(false)}>
                        <GardenText variant="button" color={GardenColors.sage}>
                          Done
                        </GardenText>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </GardenCard>

            <GardenCard style={styles.card}>
              <View style={styles.rowCopy}>
                <GardenText variant="body">Contact Events Reminder</GardenText>
                <GardenText variant="meta" color="#6A7868">
                  Lead time for birthdays and contact events.
                </GardenText>
              </View>
              <View style={styles.chipsRow}>
                {eventLeadOptions.map((days) => {
                  const selected = contactEventsReminderDays === days;
                  return (
                    <Pressable
                      key={days}
                      onPress={() => setContactEventsReminderDays(days)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}>
                      <GardenText variant="meta" color={selected ? GardenColors.white : GardenColors.forest}>
                        {days} day{days === 1 ? '' : 's'}
                      </GardenText>
                    </Pressable>
                  );
                })}
              </View>
            </GardenCard>
          </ScrollView>

          <Pressable
            style={styles.cta}
            onPress={() => {
              onSave({
                shouldKeepRemindersPersistent: keepPersistent,
                reminderNotificationTime: toTimeText(defaultReminderTime),
                contactEventsReminderDays,
              });
              onClose();
            }}>
            <GardenText variant="button" color={GardenColors.white}>
              Save Reminder Settings
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
    minHeight: '68%',
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
    marginBottom: GardenSpacing.sm,
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
  content: {
    gap: GardenSpacing.sm,
    paddingBottom: GardenSpacing.sm,
  },
  card: {
    gap: GardenSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  timePickerBlock: {
    gap: 8,
  },
  timeTrigger: {
    height: 44,
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: 14,
    backgroundColor: GardenColors.white,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: 'rgba(90,125,88,0.12)',
    borderRadius: 14,
    backgroundColor: GardenColors.white,
    paddingVertical: 4,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
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
