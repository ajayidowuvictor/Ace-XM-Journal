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

## Planned (by phase)

- Date helpers, streaks and review calculations (Phase 5/6).
- Database migrations and repositories against real SQLite (Phase 3/4).
- Component tests for forms, dialogs and empty/loading/error states (Phase 2+).
- Critical flows: journal create/edit, task create/complete, restart persistence, habit completion, calendar accuracy, theme switching, offline/error handling (Phase 8).
- Manual testing on a real Android device (Phase 9).

## Rule

No test is skipped, weakened or deleted to obtain a green build.
