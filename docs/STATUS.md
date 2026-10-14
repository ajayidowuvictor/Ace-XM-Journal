# Project Status

Last updated: 2026-10-14

## Current phase

Phase 4: Journal with encrypted storage. Built and verified by automated checks; not yet seen on a phone (see "Not yet verified").

## Completed (verified by GitHub Actions)

- Phase 1 foundation: Expo SDK 57, React Native 0.86, Expo Router, TypeScript strict, ESLint, Prettier, Jest, CI.
- One brand theme replaces the starter's theme: colours from the logo, light and dark versions, spacing, radius, typography. Text colour pairs are tested for WCAG AA contrast.
- Appearance choice (System, Light, Dark) is saved on the device and applied across the app.
- Reusable components in `src/ui/`: Text, Card, Button (primary, secondary, danger, ghost; loading state blocks duplicate presses), TextField, SegmentedControl, ProgressBar, LoadingState, EmptyState, ErrorState, ConfirmDialog, Screen.
- App shell: first-run onboarding screen (optional name, appearance choice, "Get started"), then five native tabs: Home, Tasks, Journal, Habits, Settings.
- Home screen shows a greeting by time of day (with the name if given), the date, and quick actions.
- Settings screen has working appearance control, privacy statement and app version.
- Automated checks pass: type check, lint, format, 65 tests, Android JavaScript bundle build.
- An installable Android test build (preview .apk) was built successfully on Expo's servers (project `@ajayidowu/ace-xm-journal`). Expo created and stores the app's signing key. Built by the manually started "Android preview build" workflow, which needs the `EXPO_TOKEN` repository secret.

- Phase 3: on-device SQLite database (`src/db/`) with numbered migrations; tasks repository with soft delete; Tasks tab (add, edit, tick off, delete with confirmation; sections Overdue, Today, Upcoming, No date, Done); Home shows today's priorities and its "New task" button opens the task form.
- Database SQL is tested against a real SQLite (better-sqlite3, test-only). Automated checks now: type check, lint, format, 92 tests, Android bundle build.
- CI fix: checks piped to a log file could report success when a test failed. The workflows now use a shell that fails on any error in the pipe. Earlier green results were confirmed by reading the saved logs.

- Phase 4: Journal tab with search (title, text, tags), New entry / edit screen with autosave (saves when typing pauses and when leaving or backgrounding), mood, tags and delete with confirmation (erases the entry's content). Home's "New journal entry" opens the editor.
- Journal storage is a separate database (`journal.db`) encrypted with SQLCipher via the expo-sqlite plugin option `useSQLCipher`. The random 256-bit key is created on first use and kept in expo-secure-store (Android Keystore). If the key cannot be read or does not match, the app shows an error and never deletes or recreates the journal. Android cloud backup is switched off (`android.allowBackup: false`) because a restored database would be unreadable without its key.
- Automated checks now: type check, lint, format, 120 tests, Android bundle build.

## Device testing

- Phase 3 phone test (light theme): the owner added tasks and ticked one off; the Tasks screen (No date and Done sections, tick box, strike-through, date and priority line) and Home (Today's priorities) displayed correctly. The owner confirmed it works. Dark mode, editing, deleting and restart persistence were not shown in the screenshots.

- First phone test: the app installed and opened but showed "Unmatched Route" because there was no entry route. Fixed by adding `src/app/index.tsx`, which forwards to onboarding or Home. A new build with the fix was installed on the owner's Android phone and checked from screenshots: onboarding, Home (greeting with name, date, quick actions, empty-state cards), the five tabs with icons and labels, Settings (appearance, privacy, version) and the dark theme all display correctly. Light theme, System mode and restart persistence were not shown in the screenshots.

## Not yet verified

- The task form's due date offers No date, Today, Tomorrow, In a week (no calendar picker yet). Tasks have no categories yet. Deleting a task cannot be undone from the app.
- Encryption is not verified on a device or by tests: the automated tests run the journal SQL on plain SQLite, so they do not prove the file is encrypted. It needs a check on the phone (the build must succeed with SQLCipher and the journal must open, save and reopen). The tasks database is not encrypted (only the journal is, per the project rules).
- Because Android backup is off and the key lives only on the phone, a lost or wiped phone means a lost journal until export/backup (Phase 6) exists. Uninstalling the app erases the journal.
- The journal list shows all entries at once (no paging yet); fine for early use.
- Light theme, System mode and keeping the choice after closing the app were not covered by the owner's screenshots.
- Tasks, Journal and Habits tabs are placeholders with "coming soon" messages. Home's "New task" and "New journal entry" buttons only switch to those tabs for now. The Home cards show empty states because no data exists yet.
- Placeholder icon from the starter template is still in use (real icon is Phase 9). Splash colour is brand navy but the splash image is still the starter's.
- Onboarding has no reminder permission step yet (planned with notification settings in Phase 6).

## Known issues

- `npm audit` reports about 66 vulnerabilities (about 16 moderate, 50 high), apparently in the starter's development tooling. The CI audit step reports but does not block. Needs triage before release.
- Two temporary log branches (`bootstrap-logs`, `ci-logs`) exist in the repository. `ci-logs` is updated by CI on every run; `bootstrap-logs` can be deleted on GitHub.

## Next actions

1. Test the journal on the phone and fix what looks wrong.
2. Triage the npm audit findings before release.
