import { useRouter } from 'expo-router';

import { Button, Card, Screen, Text } from '@/ui';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Where your information lives',
    body: 'Everything you write stays on this phone. ACE XM JOURNAL has no accounts, no cloud storage, no advertising and no analytics. Nothing you enter is sent to anyone.',
  },
  {
    title: 'How the journal is protected',
    body: 'Your journal and your notes (including verses and long texts) are stored in an encrypted database. The key is created on your phone and kept in Android secure storage, so they cannot be read from the file alone. Tasks, habits and goals are stored on the phone but are not encrypted by the app.',
  },
  {
    title: 'App lock',
    body: "You can ask for a six-digit PIN (and optionally your fingerprint) when the app is opened. This stops other people who pick up your phone. Your PIN is kept only as a salted fingerprint in Android secure storage. If you forget it, your phone's own screen lock can reset it.",
  },
  {
    title: 'Backups',
    body: 'Android cloud backup is turned off for this app. If you lose your phone, uninstall the app or erase its data, your information cannot be recovered unless you made a backup. Create an encrypted backup in Settings: it is one file locked with a password you choose. Nobody, including us, can open it or reset the password if you forget it.',
  },
  {
    title: 'Exports',
    body: 'An export is a plain file that is not encrypted, and it includes your journal and notes. You choose where it goes. Keep it somewhere private. An encrypted backup is the safer way to keep a copy.',
  },
  {
    title: 'Reminders',
    body: 'The daily reminder is optional. It uses a fixed message and never contains your own words. You can turn it off at any time.',
  },
  {
    title: 'Erasing your data',
    body: 'Erase all my data in Settings permanently removes your tasks, habits, goals, journal entries and notes from this phone.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
      <Text variant="title">Privacy</Text>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <Text variant="heading">{section.title}</Text>
          <Text muted>{section.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
