# ACE XM JOURNAL

A premium daily planner, private journal, habit tracker and goal system for Android (iOS later), built with React Native, Expo and TypeScript.

**Status:** Phase 2 (design system and navigation) built. See [docs/STATUS.md](docs/STATUS.md) for what is done and what is not.

## Setup

Requirements: Node 22 and npm.

```bash
npm ci
npm start        # start the Expo dev server
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

The same checks run automatically on GitHub for every push and pull request (`.github/workflows/ci.yml`).

## Project layout

```
src/app/        screens and routes (Expo Router)
src/ui/         design tokens and reusable components
src/theme/      light/dark/system theme and saved preference
src/features/   tasks, journal, habits, goals, calendar, reviews, settings
src/db/         local SQLite database, migrations, repositories
src/lib/        date helpers, calculations, export
docs/           roadmap, architecture, status, testing, brand
assets/brand/   owner-supplied logo
```

## Privacy

The first release is local-only: data stays on the device. No journal content is sent anywhere.

## More

- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing](docs/TESTING.md)
- [Brand](docs/BRAND.md)
- [Engineering rules](CLAUDE.md)
