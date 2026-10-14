# Project Status

Last updated: 2026-10-14

## Current phase

Phase 2: Design system and navigation. Done: verified by automated checks and seen on a real Android phone. Next: Phase 3 (tasks and local database).

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

## Device testing

- First phone test: the app installed and opened but showed "Unmatched Route" because there was no entry route. Fixed by adding `src/app/index.tsx`, which forwards to onboarding or Home. A new build with the fix was installed on the owner's Android phone and checked from screenshots: onboarding, Home (greeting with name, date, quick actions, empty-state cards), the five tabs with icons and labels, Settings (appearance, privacy, version) and the dark theme all display correctly. Light theme, System mode and restart persistence were not shown in the screenshots.

## Not yet verified

- Light theme, System mode and keeping the choice after closing the app were not covered by the owner's screenshots.
- Tasks, Journal and Habits tabs are placeholders with "coming soon" messages. Home's "New task" and "New journal entry" buttons only switch to those tabs for now. The Home cards show empty states because no data exists yet.
- Placeholder icon from the starter template is still in use (real icon is Phase 9). Splash colour is brand navy but the splash image is still the starter's.
- Onboarding has no reminder permission step yet (planned with notification settings in Phase 6).

## Known issues

- `npm audit` reports about 66 vulnerabilities (about 16 moderate, 50 high), apparently in the starter's development tooling. The CI audit step reports but does not block. Needs triage before release.
- Two temporary log branches (`bootstrap-logs`, `ci-logs`) exist in the repository. `ci-logs` is updated by CI on every run; `bootstrap-logs` can be deleted on GitHub.

## Next actions

1. Start Phase 3: tasks, local database, dashboard with real data.
2. Triage the npm audit findings before release.
