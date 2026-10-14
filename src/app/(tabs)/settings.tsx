import Constants from 'expo-constants';

import { THEME_PREFERENCES, type ThemePreference } from '@/theme/schemes';
import { useTheme } from '@/theme/context';
import { Card, Screen, SegmentedControl, Text } from '@/ui';

const APPEARANCE_OPTIONS = THEME_PREFERENCES.map((value) => ({
  value,
  label: value === 'system' ? 'System' : value === 'light' ? 'Light' : 'Dark',
}));

export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();

  return (
    <Screen title="Settings">
      <Card>
        <Text variant="heading">Appearance</Text>
        <SegmentedControl<ThemePreference>
          accessibilityLabel="Appearance"
          options={APPEARANCE_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
        <Text variant="caption" muted>
          System follows your phone&apos;s light or dark setting.
        </Text>
      </Card>

      <Card>
        <Text variant="heading">Privacy</Text>
        <Text muted>
          In this version, your information is stored only on this device. There are no accounts and
          nothing is synced to the cloud.
        </Text>
      </Card>

      <Card>
        <Text variant="heading">About</Text>
        <Text>ACE XM JOURNAL</Text>
        <Text muted>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </Card>
    </Screen>
  );
}
