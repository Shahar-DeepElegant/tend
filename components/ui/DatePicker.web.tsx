import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { GardenText } from '@/components/ui/garden-primitives';
import { GardenColors, GardenRadius } from '@/constants/design-system';

type DatePickerProps = {
  value: Date;
  mode?: 'date' | 'time';
  onChange: (nextDate: Date) => void;
  style?: StyleProp<ViewStyle>;
};

type Meridiem = 'AM' | 'PM';

export function DatePicker({ value, mode = 'time', onChange, style }: DatePickerProps) {
  const hours24 = value.getHours();
  const hour12 = ((hours24 + 11) % 12) + 1;
  const minute = value.getMinutes();
  const meridiem: Meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const [hourText, setHourText] = useState(`${hour12}`.padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(`${minute}`.padStart(2, '0'));

  useEffect(() => {
    setHourText(`${hour12}`.padStart(2, '0'));
    setMinuteText(`${minute}`.padStart(2, '0'));
  }, [hour12, minute]);

  if (mode === 'date') {
    return (
      <View style={[styles.unsupportedWrap, style]}>
        <GardenText variant="meta">Date mode is not supported in web fallback yet.</GardenText>
      </View>
    );
  }

  const setTime = (nextHour12: number, nextMinute: number, nextMeridiem: Meridiem) => {
    const next = new Date(value);
    const normalizedHour =
      nextMeridiem === 'AM' ? (nextHour12 === 12 ? 0 : nextHour12) : nextHour12 === 12 ? 12 : nextHour12 + 12;
    next.setHours(normalizedHour, nextMinute, 0, 0);
    onChange(next);
  };

  const incHour = () => setTime(hour12 === 12 ? 1 : hour12 + 1, minute, meridiem);
  const decHour = () => setTime(hour12 === 1 ? 12 : hour12 - 1, minute, meridiem);
  const incMinute = () => setTime(hour12, (minute + 1) % 60, meridiem);
  const decMinute = () => setTime(hour12, (minute + 59) % 60, meridiem);

  const commitHourText = () => {
    const parsed = Number.parseInt(hourText || `${hour12}`, 10);
    const safeHour = Number.isNaN(parsed) ? hour12 : Math.max(1, Math.min(parsed, 12));
    setTime(safeHour, minute, meridiem);
  };

  const commitMinuteText = () => {
    const parsed = Number.parseInt(minuteText || `${minute}`, 10);
    const safeMinute = Number.isNaN(parsed) ? minute : Math.max(0, Math.min(parsed, 59));
    setTime(hour12, safeMinute, meridiem);
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.timeRow}>
        <NumberStepper
          inputValue={hourText}
          onInputChange={(text) => setHourText(text.replace(/\D/g, '').slice(0, 2))}
          onInputCommit={commitHourText}
          onIncrement={incHour}
          onDecrement={decHour}
        />
        <GardenText variant="section">:</GardenText>
        <NumberStepper
          inputValue={minuteText}
          onInputChange={(text) => setMinuteText(text.replace(/\D/g, '').slice(0, 2))}
          onInputCommit={commitMinuteText}
          onIncrement={incMinute}
          onDecrement={decMinute}
        />
      </View>
      <View style={styles.ampmRow}>
        {(['AM', 'PM'] as Meridiem[]).map((option) => {
          const selected = meridiem === option;
          return (
            <Pressable
              key={option}
              onPress={() => setTime(hour12, minute, option)}
              style={[styles.ampmChip, selected ? styles.ampmChipSelected : null]}>
              <GardenText variant="meta" color={selected ? GardenColors.white : GardenColors.forest}>
                {option}
              </GardenText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NumberStepper({
  inputValue,
  onInputChange,
  onInputCommit,
  onIncrement,
  onDecrement,
}: {
  inputValue: string;
  onInputChange: (text: string) => void;
  onInputCommit: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onIncrement} style={styles.stepperButton}>
        <MaterialIcons name="keyboard-arrow-up" size={18} color={GardenColors.sage} />
      </Pressable>
      <TextInput
        value={inputValue}
        onChangeText={onInputChange}
        onBlur={onInputCommit}
        onSubmitEditing={onInputCommit}
        keyboardType="number-pad"
        style={styles.stepperInput}
      />
      <Pressable onPress={onDecrement} style={styles.stepperButton}>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={GardenColors.sage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepper: {
    width: 74,
    borderWidth: 1,
    borderColor: GardenColors.border,
    borderRadius: 14,
    backgroundColor: GardenColors.white,
    overflow: 'hidden',
  },
  stepperButton: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8F4',
  },
  stepperInput: {
    height: 44,
    textAlign: 'center',
    color: GardenColors.forest,
    fontSize: 23,
    lineHeight: 28,
    paddingVertical: 0,
  },
  ampmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ampmChip: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: GardenRadius.chip,
    borderWidth: 1,
    borderColor: GardenColors.border,
    backgroundColor: GardenColors.white,
  },
  ampmChipSelected: {
    borderColor: GardenColors.sage,
    backgroundColor: GardenColors.sage,
  },
  unsupportedWrap: {
    paddingVertical: 8,
  },
});
