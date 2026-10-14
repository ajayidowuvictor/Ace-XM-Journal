# ACE XM JOURNAL: Engineering rules

## Product
- Name is always written **ACE XM JOURNAL**. Android first, iOS later from the same codebase.
- First release is local-only (no accounts, no cloud). Journal data is encrypted on the device.
- App ID: `com.ajayidowuvictor.acexmjournal`.

## Stack
React Native, Expo, TypeScript (strict), Expo Router, expo-sqlite. Check current official docs before adding a library. Never invent package APIs or config.

## Working rules
- Work in small, reviewable units on feature branches; open pull requests for substantial changes.
- Run typecheck, lint, format check and tests before every commit. Never weaken or skip a test to get a green build.
- Report only what has actually been implemented and verified. Do not claim a build, test run or store step succeeded without a real result.
- Do not commit secrets. Only public keys in the app. Never ship a Supabase service-role key.
- Never write journal text to logs. Do not send journal content to external services without explicit user consent.
- Destructive actions (delete, wipe) always require confirmation.
- Day-based records use local calendar dates (`YYYY-MM-DD`); moments use UTC timestamps.
- Use design tokens from `src/ui/tokens.ts`; do not hard-code colours or spacing in screens.
- Keep `docs/STATUS.md` current after each unit of work.
