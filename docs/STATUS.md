# Project Status

Last updated: 2026-10-15

## Current phase

Feature-complete for the first (local-only) release, pending the owner's phone testing. Everything below is verified by automated checks (type check, lint, format, 179 tests, Android bundle build) unless stated otherwise. Phases 4 and later have not been seen on a phone yet.

## What the app does

- **Shell and design:** brand theme (light, dark, system), first-run onboarding (optional name), five native tabs (Home, Tasks, Journal, Habits and goals, Settings), reusable accessible components. *Seen on a phone.*
- **Tasks:** add, edit, tick off, delete with confirmation; sections Overdue, Today, Upcoming, No date, Done; due dates by quick choice; priority. *Seen on a phone (light theme).*
- **Journal:** encrypted database (SQLCipher, key in Android secure storage), entries with title, text, mood and tags, autosave, search, delete erases content. *Not yet seen on a phone; encryption itself is not proven by automated tests.*
- **Habits:** daily check-in, current and best streak, today's progress, shown on Home. *Not yet seen on a phone.*
- **Goals:** goals with target date, steps and progress, marked achieved. *Not yet seen on a phone.*
- **Calendar:** month view with dots for days with tasks due, habit check-ins or journal entries; tap a day to see them. *Not yet seen on a phone.*
- **Weekly review:** 7-day summary and a reflection saved as an encrypted journal entry. *Not yet seen on a phone.*
- **Settings:** appearance, optional daily reminder (fixed text, never your words), export to a plain JSON file (with warning), erase all data (two confirmations), privacy page. *Not yet seen on a phone. The reminder and the share sheet need a real device to confirm.*
- **Branding:** app icon, adaptive icon and splash derived from the owner's logo emblem. *Not yet seen on a phone.*

## Device testing history

- Phase 2 build: first launch showed "Unmatched Route"; fixed with an entry route; retest passed.
- Phase 3 build: Tasks and Home priorities confirmed working by the owner.
- Journal, habits and everything after: waiting for the owner's test of the final build.

## Not yet verified

- Everything marked "not yet seen on a phone" above. In particular: that the encrypted journal opens, saves and reopens; that the reminder fires; that export opens the share sheet; and that the new icon and splash look right.
- SQL is tested on plain SQLite (`better-sqlite3`), not SQLCipher.
- No Play Store step has been done. See `docs/RELEASE.md`.

## Known limits

- Losing the phone, uninstalling the app or clearing its data loses all data (cloud backup is off by design); export is the only copy.
- Habits are daily only; due dates use quick choices; tasks are not linked to goals; the journal list is not paged.
- Screens work out "today" when they draw, so an app left open past midnight updates on the next interaction.
- Tasks, habits and goals are stored on the phone but not encrypted by the app (only the journal is).
- Android only has been built. iOS later from the same code.
- Cloud accounts and sync (roadmap Phase 7) are intentionally not built for this release.
- Dependency audit: triaged in `docs/SECURITY.md`; five underlying advisories accepted with reasons.
- Two temporary log branches (`ci-logs`, `eas-logs`) are used by the workflows; `bootstrap-logs` can be deleted on GitHub.
- Some commits in the history are authored by the GitHub Actions bot (automatic formatting).

## Next actions

1. Owner installs the latest build, tests every screen and reports what to fix.
2. Fix reported problems, rebuild, retest.
3. Follow `docs/RELEASE.md` for the Play internal testing track.
