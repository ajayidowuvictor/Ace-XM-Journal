import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SegmentedControl, TextField, spacing } from '../../ui';
import { parseTypedStart, to12Hour, withMeridiem } from './logic';

type Props = {
  /** The time in minutes after midnight. */
  value: number;
  /** Called whenever a complete, valid time has been entered or AM/PM is switched. */
  onChange: (minutes: number) => void;
  /** Spoken name for the group, such as "Reminder time". */
  label: string;
};

const digits = (text: string) => text.replace(/\D/g, '').slice(0, 2);

function texts(minutes: number) {
  const { hour12, minute } = to12Hour(minutes);
  return { hour: String(hour12), minute: String(minute).padStart(2, '0') };
}

/** Type a time on a 12-hour clock: hour, minute and AM or PM. */
export function ClockInput({ value, onChange, label }: Props) {
  const [hourText, setHourText] = useState(() => texts(value).hour);
  const [minuteText, setMinuteText] = useState(() => texts(value).minute);
  const pm = value >= 720;

  function type(nextHour: string, nextMinute: string) {
    const parsed = parseTypedStart(nextHour, nextMinute, pm);
    if (parsed !== null) onChange(parsed);
  }

  function tidy() {
    const next = texts(value);
    setHourText(next.hour);
    setMinuteText(next.minute);
  }

  return (
    <View accessibilityLabel={label} style={styles.group}>
      <SegmentedControl<'am' | 'pm'>
        accessibilityLabel={`${label}: morning or afternoon`}
        options={[
          { value: 'am', label: 'AM' },
          { value: 'pm', label: 'PM' },
        ]}
        value={pm ? 'pm' : 'am'}
        onChange={(choice) => onChange(withMeridiem(value, choice === 'pm'))}
      />
      <View style={styles.row}>
        <View style={styles.field}>
          <TextField
            label="Hour (1 to 12)"
            value={hourText}
            onChangeText={(text) => {
              const clean = digits(text);
              setHourText(clean);
              type(clean, minuteText);
            }}
            onBlur={tidy}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={styles.field}>
          <TextField
            label="Minute (0 to 59)"
            value={minuteText}
            onChangeText={(text) => {
              const clean = digits(text);
              setMinuteText(clean);
              type(hourText, clean);
            }}
            onBlur={tidy}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1 },
});
