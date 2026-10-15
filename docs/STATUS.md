# Project Status

Last updated: 2026-10-16

## Current phase

Feature-complete for the first (local-only) release. The owner has now walked through every screen on a phone (Infinix Hot 30i, Android 12) and reported that each worked. Automated checks (type check, lint, format, 179 tests, Android bundle build) back everything else.

## In progress: Phase 1 (design and Today planner)

Built on branch `feat/design-and-today` and checked by CI (type check, lint, format, 251 tests, Android bundle). Not yet seen on a phone:

- **New look:** Inter font, cool-mist palette, new buttons, cards, round check circles, haptics (see `docs/DESIGN.md`).
- **Today planner (Home tab):** a Today / Tomorrow switch, up to three focus tasks, a time rail of blocks (start time, length, optional linked task, "now" marker, free-time gaps), gentle "Still waiting from earlier" tasks that can be moved to today or tomorrow, habits, and an evening wrap-up saved as an encrypted journal entry (shown from 17:00).
- **Also changed:** saving the weekly review twice for the same week updates the first entry; older tasks read "From earlier" instead of "Overdue". Day plans are included in the export and removed by "Erase all my data".
- **Database:** migration 4 adds `plan_focus` and `plan_blocks`. Existing tasks, habits, goals and journal entries are not touched.

## What the app does

- **Shell and design:** brand theme (light, dark, system), first-run onboarding (optional name), five native tabs (Home, Tasks, Journal, Habits and goals, Settings), reusable accessible components. _Seen on a phone._
- **Tasks:** add, edit, tick off, delete with confirmation; sections Overdue, Today, Upcoming, No date, Done; due dates by quick choice; priority. _Seen on a phone (light theme)._
- **Journal:** encrypted database (SQLCipher, key in Android secure storage), entries with title, text, mood and tags, autosave, search, delete erases content. _Seen on a phone: entries saved, listed, found by search and still there after reopening. Encryption itself is not proven by automated tests or by the phone check._
- **Habits:** daily check-in, current and best streak, today's progress, shown on Home. _Seen on a phone._
- **Goals:** goals with target date, steps and progress, marked achieved. _Seen on a phone (goal created with a date)._
- **Calendar:** month view with dots for days with tasks due, habit check-ins or journal entries; tap a day to see them. _Seen on a phone._
- **Weekly review:** 7-day summary and a reflection saved as an encrypted journal entry. _Seen on a phone. Each save adds a new entry, so saving twice in one week gives two entries._
- **Settings:** appearance, optional daily reminder (fixed text, never your words), export to a plain JSON file (with warning), erase all data (two confirmations), privacy page. _Seen on a phone: reminder time can be chosen, export opened the share sheet, privacy page reads correctly, erase asked for DELETE and reported that everything was erased. Not yet confirmed: that the reminder notification actually arrives._
- **Branding:** app icon, adaptive icon and splash derived from the owner's logo emblem. _Icon seen on the phone's home screen; splash not yet confirmed._

## Device testing history

- Phase 2 build: first launch showed "Unmatched Route"; fixed with an entry route; retest passed.
- Phase 3 build: Tasks and Home priorities confirmed working by the owner.
- Final-feature builds (130 MB, all processor types): the phone reported "App not installed as package appears to be invalid", twice. The files passed every check we could run (zip test, signature, package name, version, minimum Android version, alignment) and matched the earlier build that installed. The cause on the phone was not identified.
- 64-bit-only build (`preview-arm64` profile, about 49 MB): installed on the phone. The owner then tested icon, tasks, journal, habits, goals, calendar, weekly review, reminder choice, export, privacy page and erase-all; all were reported working.

## Not yet verified

- That the reminder notification arrives at the chosen time.
- That the journal still works after "Erase all my data" (new entry, close the app, reopen).
- That the encryption itself is effective on the device (only the app's behaviour was seen).
- The splash screen, and the 32-bit or very old phones that the 64-bit-only test build does not support (the default `preview` profile still builds for all processor types).
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

0. Owner tests the Phase 1 build on the phone and reports what to adjust (look, planner, wording). Then merge the branch.

1. Owner confirms the reminder (next morning) and the journal after erase-all, and reports anything else to fix.
2. Decide whether saving the weekly review twice should update the existing entry instead of adding a second one.
3. Follow `docs/RELEASE.md` for the Play internal testing track.
