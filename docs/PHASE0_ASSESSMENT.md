# ACE XM JOURNAL: Phase 0 Assessment

Date: 2026-10-14

## 1. Repository assessment

| Item                                  | Finding                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Repository                            | `ajayidowuvictor/Ace-XM-Journal` (public)                                    |
| Contents                              | Completely empty. No commits, no files, no branches except an unborn `main`. |
| Existing frameworks / dependencies    | None                                                                         |
| Existing code, docs, tests, workflows | None                                                                         |
| Overwrite risk                        | None. Clean start.                                                           |
| Workspace tooling                     | Node 22.22.0, npm 10.9.4, git 2.43, Java present. No `eas` CLI, no `adb`.    |
| Write access                          | **Pushing is currently refused** (see Blockers). Reading and cloning work.   |

Because the repo is empty, the preferred architecture from the master prompt applies with no conflicts.

## 2. Proposed architecture

- **App:** React Native + Expo (SDK taken from the official `create-expo-app` template at Phase 1; the exact version will be recorded in `docs/ARCHITECTURE.md`), TypeScript strict mode, Expo Router.
- **Layers** (kept separate so the data model can later sync to the cloud):
  1. `app/`: screens and routes only.
  2. `src/ui/`: design tokens and reusable components.
  3. `src/features/<feature>/`: tasks, journal, habits, goals, calendar, reviews, settings. Each holds its own components, hooks and logic.
  4. `src/db/`: SQLite (expo-sqlite), numbered migrations, repository functions. The only code that touches SQL.
  5. `src/lib/`: date and time-zone helpers, streak calculation, export.
- **Data model (local first):** tasks, categories, journal_entries, tags, entry_tags, mood_records, habits, habit_completions, goals, milestones, task_goal_links, reviews, settings. Every row gets a UUID, `created_at`, `updated_at` and `deleted_at` so sync can be added later without a rewrite.
- **Dates:** stored as local calendar date strings (`YYYY-MM-DD`) for day-based records, and UTC timestamps for moments. This avoids time-zone and date-boundary bugs in habits and the calendar.
- **Cloud (Supabase):** deliberately deferred to Phase 7. Initial release is local-only unless you decide otherwise. When added: Supabase Auth, row-level security on every table, and only the public anon key in the app.

## 3. Prioritised roadmap

1. Phase 1 Foundation (project, TypeScript, lint, tests, CI)
2. Phase 2 Design system and navigation
3. Phase 3 Tasks and dashboard
4. Phase 4 Journal
5. Phase 5 Habits, goals, calendar
6. Phase 6 Reviews and settings (export, delete, privacy)
7. Phase 7 Accounts and sync (only if needed for v1)
8. Phase 8 Full QA pass
9. Phase 9 Android and iOS builds
10. Phase 10 Beta and release preparation
11. Phase 11 Maintenance

Onboarding is built alongside Phase 2 and finished in Phase 6 (reminder permission needs notifications settings).

## 4. Dependencies (planned) and purpose

| Package                                               | Purpose                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| expo, react-native, expo-router                       | App runtime and navigation                           |
| typescript                                            | Strict type checking                                 |
| expo-sqlite                                           | Local database                                       |
| react-native-reanimated, react-native-gesture-handler | Subtle animations and gestures                       |
| react-hook-form + zod                                 | Form handling and validation                         |
| expo-notifications                                    | Optional reminders (permission requested explicitly) |
| expo-image-picker                                     | Journal photo attachments                            |
| expo-file-system, expo-sharing                        | Data export                                          |
| eslint, prettier                                      | Linting and formatting                               |
| jest, jest-expo, @testing-library/react-native        | Unit and component tests                             |
| @supabase/supabase-js                                 | Phase 7 only, if cloud is approved                   |

Each dependency is verified against current official documentation at the moment it is added.

## 5. Testing strategy

- TypeScript check, ESLint and Prettier on every push (GitHub Actions).
- Unit tests for date helpers, streak logic, review calculations and migrations.
- Repository tests against a real SQLite instance for create, edit, delete and search.
- Component tests for forms, dialogs and empty, loading and error states.
- Critical-flow tests: the nine priority scenarios listed in Phase 8 of the master prompt.
- Manual testing on a real Android device for restart persistence, themes, keyboard behaviour and offline use.
- No test is skipped or weakened to get a green build.

## 6. Security and privacy checklist

- [ ] No secrets in the repo; `.env*` ignored; only public keys in the app.
- [ ] Service-role keys never shipped in the app.
- [ ] Journal text never written to logs.
- [ ] No journal content sent to external services without explicit consent.
- [ ] Row-level security on every cloud table (Phase 7).
- [ ] Deletion and export implemented and confirmed before destructive actions.
- [ ] Privacy screen describes exactly what is stored locally and what, if anything, leaves the device.
- [ ] Dependency audit (`npm audit`) and secret scan in CI.
- [ ] Decision pending: encrypt the local journal database at rest (see Decisions).

## 7. Build and deployment plan

- Android first: EAS Build `development`, then `preview` (installable APK), then `production` (app bundle).
- Application identifier, icons and splash configured in Phase 9.
- iOS: configuration verified, but building and signing need an Apple Developer account.
- No build, store submission or signing will be reported as done without a verified result.

## 8. Blockers requiring human action

1. **GitHub write access (blocking Phase 1 pushes).** This session can read and clone the repo but pushes are refused. Fix: install the Claude GitHub App on your account at https://github.com/apps/claude/installations/select_target (choose `Ace-XM-Journal`), or reconnect GitHub in Claude settings.
2. **Expo account** (free) for EAS builds. Needed by Phase 9.
3. **Apple Developer account** (paid) for iOS. Needed only when you want iOS.
4. **Google Play Console account** (one-time fee) for Android store release.

## Decisions needed from you

1. Is the first release **local-only** (no accounts, no cloud)? Recommended: yes, add cloud sync later.
2. Should the journal database be **encrypted on the device**? Stronger privacy, slightly more setup.
3. Do you want to supply a **logo or brand colours**, or should I design the visual identity? (Your company colours are not assumed for this product.)
4. Preferred **application ID**, for example `com.yourname.acexmjournal`.
