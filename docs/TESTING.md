# Testing

## Commands

```bash
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint (Expo config)
npm run format:check  # Prettier
npm test              # Jest with the jest-expo preset
```

## Currently covered

- Design tokens: brand colours match the logo; all text colour pairs in light and dark themes meet WCAG AA contrast (4.5:1).
- Theme preference logic (valid values, fallback to system, device setting).
- Greeting by hour and date formatting.
- Components: Button (press, disabled, loading blocks duplicates), EmptyState, ErrorState, ConfirmDialog (confirm and cancel are separate), SegmentedControl, TextField error display, progress clamping.

The CI workflow also checks that the Android JavaScript bundle builds, and saves its output to the `ci-logs` branch.

- Database: migrations (new database, repeat run, upgrade, failed migration) and the tasks repository, run against a real in-memory SQLite (`better-sqlite3`, dev-only; helper in `src/db/testing/`).
- Task logic (grouping, sorting, title checks, due-date choices), local date helpers, id format.

- Journal: repository (save, list order, search incl. % and _, update, erase on delete), journal migrations, key creation/reuse/refusal to overwrite, tags, mood, autosave timing. These run on plain SQLite; encryption itself still needs a device check.

- Habits: streak, best streak, window counts and today summary (including month/year boundaries), repository (history, undo, delete, deleted habits) and the version 1 to 2 database upgrade keeping tasks.

## Planned (by phase)

- Date helpers, streaks and review calculations (Phase 5/6).
- Database migrations and repositories against real SQLite (Phase 3/4).
- Component tests for forms, dialogs and empty/loading/error states (Phase 2+).
- Critical flows: journal create/edit, task create/complete, restart persistence, habit completion, calendar accuracy, theme switching, offline/error handling (Phase 8).
- Manual testing on a real Android device (Phase 9).

## Rule

No test is skipped, weakened or deleted to obtain a green build.
