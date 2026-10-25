import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { THEME_PREFERENCES, type ThemePreference } from '@/theme/schemes';
import { useTheme } from '@/theme/context';
import { Button, Screen, SegmentedControl, Text, TextField, fonts, spacing } from '@/ui';

const APPEARANCE_OPTIONS = THEME_PREFERENCES.map((value) => ({
  value,
  label: value === 'system' ? 'System' : value === 'light' ? 'Light' : 'Dark',
}));

const BENEFITS = [
  { title: 'Plan your day', body: 'Keep tasks, priorities and goals in one calm place.' },
  { title: 'Write privately', body: 'A journal that stays on your device.' },
  { title: 'Build habits', body: 'Track what you do, with honest progress.' },
];

export default function OnboardingScreen() {
  const { complete } = useOnboarding();
  const { preference, setPreference } = useTheme();
  const [name, setName] = useState('');

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="caption" tone="primary" style={styles.brand}>
          Ace Notes
        </Text>
        <Text variant="title">Your calm, private space to plan, reflect and grow.</Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.title}>
            <Text variant="heading">{benefit.title}</Text>
            <Text muted>{benefit.body}</Text>
          </View>
        ))}
      </View>

      <TextField
        label="What should we call you? (optional)"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={40}
        returnKeyType="done"
      />

      <View style={styles.appearance}>
        <Text variant="heading">Appearance</Text>
        <SegmentedControl<ThemePreference>
          accessibilityLabel="Appearance"
          options={APPEARANCE_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
      </View>

      <Button label="Get started" onPress={() => complete(name)} />
      <Text variant="caption" muted>
        Your information stays on this device. You can change the appearance later in Settings.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingTop: spacing.lg },
  brand: { letterSpacing: 2, fontFamily: fonts.bold },
  benefits: { gap: spacing.md },
  appearance: { gap: spacing.sm },
});
