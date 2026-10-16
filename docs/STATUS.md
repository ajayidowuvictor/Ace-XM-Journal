# Project Status

Last updated: 2026-10-16

## Current phase

Feature-complete for the first (local-only) release. The owner has now walked through every screen on a phone (Infinix Hot 30i, Android 12) and reported that each worked. Automated checks (type check, lint, format, 403 tests, Android bundle build) back everything else.

## Phase 1 (design and Today planner): merged

Built, checked by CI and tried on the owner's phone (the new look worked and the haptic tap was felt). Merged to `main` as pull request #2. Details are in `docs/DESIGN.md`.

- **New look:** Inter font, cool-mist palette, new buttons, cards, round check circles, haptics.
- **Today planner (Home tab):** Today / Tomorrow switch, up to three focus tasks, a time rail of blocks, gentle "Still waiting from earlier" tasks, habits, and an evening wrap-up saved as an encrypted journal entry (from 17:00).
- **Database:** migration 4 (`plan_focus`, `plan_blocks`).

## Phase 2 (Notes): merged

Tried on the owner's phone and reported working. Merged as pull request #3. What it added:

- **Where:** the Journal tab now has a Journal | Notes switch.
- **Notes, verses and long texts:** three kinds in one editor (switchable). A verse has a reference field (for example "John 3:16 (KJV)"); the owner types or pastes verses, there is no built-in Bible. A long text has an optional source and shows words and reading time.
- **Notebooks:** make, rename and delete (deleting keeps the notes), file a note in one, pin notes to the top, filter by notebook and kind, search title, text and reference.
- **Reading view:** full-screen serif page. Verses are centred with a quotation mark and the reference; long texts show as paragraphs. Five text sizes (remembered), Share (the phone's share sheet, only when the owner taps it), Edit.
- **Storage:** inside the encrypted journal database (journal migration 2: `notebooks`, `notes`). Deleting a note erases its text. Notes are included in the export and removed by "Erase all my data". The privacy page wording was updated.

## Phase 3 (app lock and encrypted backup): merged

Tried on the owner's phone (app lock with PIN and fingerprint, backup and restore, including restoring a backup on the same phone) and reported working. Merged as pull request #4. Making a backup takes about 20 seconds on the owner's phone (Infinix Hot 30i), so the scrypt setting (N=16384) is kept; the screen's warning says up to a minute. What it added:

- **App lock (Settings > App lock):** six-digit PIN kept only as a salted SHA-256 fingerprint in Android secure storage; optional fingerprint (needs a saved finger; the permission is no longer blocked in `app.json`); lock right away, after 1 minute or after 5 minutes away; waits of 30 s, 1 min, 5 min, 15 min after 5 or more wrong PINs in a row; "Forgot PIN?" uses the phone's own screen lock to turn the app lock off, or offers erase-everything with the typed DELETE confirmation. The lock is a full-screen modal, so it also covers open pop-ups. It stops people who pick up an unlocked phone. It does **not** protect the data cryptographically: the journal key does not depend on the PIN, and tasks, habits and goals are still not encrypted.
- **Encrypted backup (Settings > Backup and restore):** one file, `.acexmbackup`, made from a password of at least 10 characters. Key: scrypt (noble-hashes, N=16384, r=8, p=1, random 16-byte salt) then AES-256-GCM (expo-crypto) with the file settings bound in as authenticated data. Restore asks for the file and password, shows what it contains, and only after a confirmation replaces everything on the phone (each database all-or-nothing). A wrong password and a damaged file look the same.
- **Not verified on a device:** how long scrypt takes in the app's JavaScript engine on the owner's phone (expected a few seconds, the screen warns "up to a minute"); that the fingerprint prompt works; that the share sheet and file picker return without locking the app; that a backup made on one install restores on another. The work factor is stored in each file, so it can be changed later without breaking old backups.
- **Tests:** PIN logic, PIN store (salted, never the PIN), PIN pad, byte helpers (base64, UTF-8, against Node), backup format (round trip, wrong password, tampering, changed settings, large data, with Node's scrypt and AES standing in), restore (round trip with real SQL, replaces existing data, all-or-nothing, older exports).
- **Note on the GitHub link:** the session lost GitHub access in the middle of this phase (the owner had disconnected the repository for another project) and it was reconnected; nothing was lost.

## Phase 4a (repeating tasks and task reminders): tried, in pull request #5

Built on branch `feat/repeat-reminders`; CI passed (38 test groups, 368 tests). The owner installed the build and reported it works (repeats and the form); whether the reminder notification actually arrived was not specifically reported. What it added:

- **Repeat:** a task can repeat every day, every weekday, every week or every month. Finishing it adds the next copy (same title, notes, priority, repeat rule and reminder), dated after both the old due date and today. Weekly keeps the weekday; monthly keeps the day of the month (the last day in short months). Un-ticking a task does not remove the copy already made.
- **Reminder time:** each task can have a reminder at 8:00, 12:00, 17:00 or 20:00 on its due date (scheduled on the phone as one notification per task, nearest 50 only). By default the notification does not show the task (Settings > Task reminders > Hide names); the owner can choose to show names. Repeating and reminders need a due date, so choosing either gives a task with no date today's date.
- **Daily reminder:** now replaces only its own notification, so it no longer cancels task reminders.
- **Database:** migration 5 (`repeat`, `reminder_time` on tasks). Exports and backups carry both fields; older exports and backups restore as "does not repeat, no reminder".
- **Not confirmed:** that task reminder notifications appear at the chosen time (the daily reminder firing is also still unconfirmed).

## Phase 4b (search and templates)

Built on branch `feat/search-templates` (on top of 4a); CI passed (40 test groups, 379 tests). Test build installed by the owner to try. What it added:

- **Search everything** (button on Home, screen `/search`): looks through tasks, goals (and their steps), habits, journal entries and notes at once. Every word must match (any order, ignoring capitals), from 2 letters; up to 8 results per kind with a count; open tasks listed before done ones. Tapping a result opens it (task, goal and habit forms, the journal entry, the note's reading view). Nothing is saved or logged; text is shown on screen only.
- **Templates:** a blank new journal entry offers Gratitude, Daily reflection, Prayer, Weekly check-in; a blank new note (kind Note) offers Sermon notes, Meeting notes, Book notes. A template fills the page only when nothing has been typed. A template left untouched is saved like any other entry (delete it if unwanted).

## Phase 4c (insights)

Built on branch `feat/insights` (on top of 4b); CI passed (41 test groups, 387 tests). The owner installed the build. Insights (button on Home, screen `/insights`) is worked out on the phone from existing data, nothing new stored: tasks finished in each of the last 8 weeks (bars; each week is the 7 days ending on the date shown, like the Weekly review); each habit's days done out of the last 30 and its current streak; journal days written out of the last 30, writing streak, average mood by week; totals so far. Pull requests: #5 (4a), #6 (4b and 4c); not yet merged when Phase 5 started.

## Done: Phase 5a (new look from the owner's Stitch designs)

Merged as pull request #7 (CI passed on e5f719a: type check, lint, format, 42 test groups, 403 tests). The owner supplied five Stitch screens (Home, Journal, Tasks, Settings, Habits and Goals). Copied: the look (header with logo, large titles, soft cards, chips, pill tab indicator, navy and green). Deliberately not copied because it would be untrue or does not exist: "Vault Encrypted / hardware keystore / Hardware Bound / AES-256 enclave" wording and an "Encrypted" badge on every screen (only the journal and notes are encrypted; the badge is on Journal only), "Sync Live", weather, voice memo and transcription, scripture translations, images in entries, hydration litres, AI habit suggestions and the Midday reset timer.

- **Header** (`AppHeader`): logo, "ACE XM JOURNAL" and the screen name on Home, Tasks, Journal, Habits and Settings; Home has a Search button, Tasks a New task button, Journal an "Encrypted" pill. Tab bar indicator is a soft navy pill.
- **Home:** Verse of the Day (picked by date from the owner's own saved verses; with none saved it invites adding one; "Reflect in your journal" opens a new entry titled "Reflection: <reference>"), "Today's flow" section name, a daily check-in card with a rotating question (shown as the faint hint in the new entry, never saved) that is replaced by the evening wrap-up from 17:00. Search moved to the header; shortcuts are Calendar, Insights and Weekly review.
- **Tasks:** Today's focus progress card, quick add (adds to today), Today / Upcoming / Done switch with counts, New task in the header.
- **Journal:** entry count with "encrypted on this device", day filter strip (All and the last 7 days), richer entry cards (day, time, read time, preview, tags), a floating "New entry" button.
- **Habits:** "Daily habits | Goals" switch, Weekly consistency card (Monday to Sunday circles and a percentage), a 7-day dot row on each habit.
- **Settings:** an honest "Your data stays here" card at the top.
- **Not done in this step:** the other screens (editors, reading view, lock screen, dialogs) keep their current look; Stitch screens for them were not supplied.

## In progress: Phase 5b (editors, lock screen, task sheet, erase dialog)

Branch `feat/redesign-2`. Not yet checked by CI or seen on a phone. The owner supplied four more Stitch screens (Journal Editor, Lock screen, Add-task sheet, Vault Wipe Confirmation). Copied: the look. Not copied because it would be untrue or does not exist: "End-to-End Encrypted", "Keystore Active", "Hardware Vault Secured", "Secure Enclave", "Zero telemetry", bold and italic formatting, voice memos, image attachments, the ".ace" file name (the real backup is `.acexmbackup`). Wording used instead: "Encrypted" (journal only), "Your journal stays on this phone."

- **Lock screen:** logo tile with a lock badge, "Unlock ACE XM JOURNAL", PIN dots, round raised keys with phone-keypad letters under the digits, fingerprint key, Forgot PIN.
- **Journal editor:** top bar with the date and Done, big borderless title and text, a card with mood, tags and "Insert a saved verse" (lists verses saved in Notes and adds one as a quotation at the end), footer with save state, word count and read time, and the Encrypted pill. Autosave unchanged, so there is no Cancel (it could not undo anything).
- **Task sheet:** cards for the task, due/reminder/repeat, and priority/category; button reads "Add to today" for a task due today.
- **Task categories (new feature, database version 6):** None, Deep work, Routine, Personal, Health; shown as a small label on the task; carried to the next copy of a repeating task; saved in backups and restored (older backups restore with no category).
- **Erase dialog:** warning icon, clear text, a note about making an encrypted `.acexmbackup` first (the backup button itself is in Settings), typed DELETE still required, Erase all and Cancel.
- **Not done:** an "export first" button inside the erase dialog.

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
- Habits are daily only; due dates use quick choices (Today, Tomorrow, In a week); tasks are not linked to goals; the journal list is not paged.
- Screens work out "today" when they draw, so an app left open past midnight updates on the next interaction.
- Tasks, habits and goals are stored on the phone but not encrypted by the app (only the journal is).
- Android only has been built. iOS later from the same code.
- Cloud accounts and sync (roadmap Phase 7) are intentionally not built for this release.
- Dependency audit: triaged in `docs/SECURITY.md`; five underlying advisories accepted with reasons.
- Two temporary log branches (`ci-logs`, `eas-logs`) are used by the workflows; `bootstrap-logs` can be deleted on GitHub.
- Some commits in the history are authored by the GitHub Actions bot (automatic formatting).

## Next actions

0. Owner tries the Phase 5a build (new look) and the Phase 5b build, merges the pull request for 5b. Then: backup safety net (last backup date and weekly nudge), reminder check, polish pass, encrypting tasks, habits and goals.

1. Owner confirms the reminder (next morning) and the journal after erase-all, and reports anything else to fix.
2. Decide whether saving the weekly review twice should update the existing entry instead of adding a second one.
3. Follow `docs/RELEASE.md` for the Play internal testing track.
