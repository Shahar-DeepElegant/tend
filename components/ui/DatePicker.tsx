import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

type DatePickerProps = {
  value: Date;
  mode?: 'date' | 'time';
  onChange: (nextDate: Date) => void;
  style?: StyleProp<ViewStyle>;
};

export function DatePicker({ value, mode = 'time', onChange, style }: DatePickerProps) {
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={style}>
      <DateTimePicker
        value={value}
        mode={mode}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={handleChange}
      />
    </View>
  );
}

