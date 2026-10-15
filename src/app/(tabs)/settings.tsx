import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { openAppDatabase } from '@/db/expoDatabase';
import { wipeAppData } from '@/db/wipeRepo';
import { buildExport, exportFileName } from '@/features/export/buildExport';
import { shareExport } from '@/features/export/shareExport';
import { useGoals } from '@/features/goals/GoalsContext';
import { useHabits } from '@/features/habits/HabitsContext';
import { useJournal } from '@/features/journal/JournalContext';
import {
  REMINDER_OPTIONS,
  parseReminderChoice,
  type ReminderChoice,
} from '@/features/reminders/logic';
import { applyReminder } from '@/features/reminders/service';
import { WipeDialog } from '@/features/settings/WipeDialog';
import { usePlanner } from '@/features/planner/PlannerContext';
import { useTasks } from '@/features/tasks/TasksContext';
import { toLocalDateString } from '@/lib/dates';
import { PREF_KEYS, readPreference, writePreference } from '@/lib/preferences';
import { THEME_PREFERENCES, type ThemePreference } from '@/theme/schemes';
import { useTheme } from '@/theme/context';
import { Button, Card, ConfirmDialog, Screen, SegmentedControl, Text } from '@/ui';

const APPEARANCE_OPTIONS = THEME_PREFERENCES.map((value) => ({
  value,
  label: value === 'system' ? 'System' : value === 'light' ? 'Light' : 'Dark',
}));

export default function SettingsScreen() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const { tasks, reload: reloadTasks } = useTasks();
  const { habits, reload: reloadHabits } = useHabits();
  const { goals, reload: reloadGoals } = useGoals();
  const { focus, blocks, reload: reloadPlanner } = usePlanner();
  const { allEntries, wipe: wipeJournal, status: journalStatus } = useJournal();

  const [reminder, setReminder] = useState<ReminderChoice>(() =>
    parseReminderChoice(readPreference(PREF_KEYS.reminder)),
  );
  const [reminderNote, setReminderNote] = useState<string | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmingExport, setConfirmingExport] = useState(false);
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [wipeNote, setWipeNote] = useState<string | null>(null);

  async function chooseReminder(choice: ReminderChoice) {
    setReminderNote(null);
    const result = await applyReminder(choice);
    if (result === 'ok') {
      setReminder(choice);
      writePreference(PREF_KEYS.reminder, choice);
      setReminderNote(choice === 'off' ? 'Reminder is off.' : 'Daily reminder is on.');
    } else {
      setReminder('off');
      writePreference(PREF_KEYS.reminder, 'off');
      setReminderNote(
        result === 'denied'
          ? 'Notifications are not allowed for this app. You can allow them in your phone settings.'
          : 'The reminder could not be set. Please try again.',
      );
    }
  }

  async function runExport() {
    setConfirmingExport(false);
    setExporting(true);
    setExportNote(null);
    try {
      const text = buildExport(
        { tasks, habits, goals, entries: allEntries, plan: { focus, blocks } },
        new Date().toISOString(),
      );
      const shared = await shareExport(exportFileName(toLocalDateString(new Date())), text);
      setExportNote(
        !shared
          ? 'Sharing is not available on this device.'
          : journalStatus === 'ready'
            ? 'Export ready. Check where you sent it.'
            : 'Export ready, but the journal could not be included because it was not available.',
      );
    } catch {
      setExportNote('The export could not be created. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function runWipe() {
    setConfirmingWipe(false);
    try {
      wipeAppData(openAppDatabase());
      reloadTasks();
      reloadHabits();
      reloadGoals();
      reloadPlanner();
      setWipeNote(
        wipeJournal()
          ? 'Everything has been erased.'
          : 'Your tasks, habits and goals were erased, but the journal could not be erased. Please try again.',
      );
    } catch {
      setWipeNote('Nothing was erased because something went wrong. Please try again.');
    }
  }

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
        <Text variant="heading">Daily reminder</Text>
        <SegmentedControl<ReminderChoice>
          accessibilityLabel="Daily reminder time"
          options={REMINDER_OPTIONS}
          value={reminder}
          onChange={chooseReminder}
        />
        <Text variant="caption" muted>
          A gentle nudge at the time you choose. It never shows your own words.
        </Text>
        {reminderNote ? (
          <Text variant="caption" accessibilityLiveRegion="polite">
            {reminderNote}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">Weekly review</Text>
        <Text muted>See how your week went and save a reflection to your journal.</Text>
        <Button
          label="Open weekly review"
          variant="secondary"
          onPress={() => router.push('/review')}
        />
      </Card>

      <Card>
        <Text variant="heading">Your data</Text>
        <Text muted>Export a copy of everything, or erase everything from this phone.</Text>
        <Button
          label="Export my data"
          variant="secondary"
          loading={exporting}
          onPress={() => setConfirmingExport(true)}
        />
        {exportNote ? (
          <Text variant="caption" accessibilityLiveRegion="polite">
            {exportNote}
          </Text>
        ) : null}
        <Button
          label="Erase all my data"
          variant="danger"
          onPress={() => setConfirmingWipe(true)}
        />
        {wipeNote ? (
          <Text variant="caption" accessibilityLiveRegion="polite">
            {wipeNote}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">Privacy</Text>
        <Text muted>
          Your information is stored only on this device. There are no accounts, no tracking and
          nothing is sent to the cloud.
        </Text>
        <Button
          label="Read how your data is protected"
          variant="ghost"
          onPress={() => router.push('/privacy')}
        />
      </Card>

      <Card>
        <Text variant="heading">About</Text>
        <Text>ACE XM JOURNAL</Text>
        <Text muted>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </Card>

      <ConfirmDialog
        visible={confirmingExport}
        title="Export your data?"
        message="The export is a plain file that is NOT encrypted and includes your journal. Only send it somewhere you trust."
        confirmLabel="Export"
        onCancel={() => setConfirmingExport(false)}
        onConfirm={runExport}
      />
      <WipeDialog
        visible={confirmingWipe}
        onCancel={() => setConfirmingWipe(false)}
        onConfirm={runWipe}
      />
    </Screen>
  );
}
