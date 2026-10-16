# Security notes

## Dependency audit triage (2026-10-15)

`npm audit` reports 66 packages, but they come from only five underlying advisories. The audit's suggested "fixes" are breaking downgrades or major upgrades of Expo, React Native or Jest and are not safe to force.

| Advisory                                                  | Severity | Reaches the shipped app?                                                                                                                                                                    | Decision                                                                                                                                     |
| --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `braces` / `micromatch` (deeply nested patterns)          | high     | No. Used by Jest and Metro to match file names on a developer or build machine.                                                                                                             | Accepted. Revisit when Expo SDK / Jest update.                                                                                               |
| `node-forge` (RSA signature check)                        | high     | No. Used by the Expo command-line tool for code signing at build time.                                                                                                                      | Accepted. Revisit on Expo update.                                                                                                            |
| `uuid` v3/v5/v6 with a supplied buffer                    | moderate | No. Pulled in by Expo build tooling (config plugins, `xcode`). The app creates its own ids and does not use that code.                                                                      | Accepted.                                                                                                                                    |
| `sprintf-js` (unbounded precision)                        | moderate | No. Used by Jest configuration tooling.                                                                                                                                                     | Accepted.                                                                                                                                    |
| `decode-uri-component` via `query-string` via Expo Router | moderate | Probably yes. It parses link addresses. A malformed link such as `acexmjournal://...` with bad percent-encoding could make the app slow for a moment. It cannot read or change stored data. | Accepted for this release: the app has no accounts or web content, and the worst case is a brief slowdown. Revisit when Expo Router updates. |

The test tools (`jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`) are now `devDependencies`, so they are not part of the app's runtime dependencies.

CI still lists the audit output on every run (non-blocking) so new findings are visible.

## Data protection summary

- Journal: encrypted database (SQLCipher), random 256-bit key held in Android secure storage. Never logged.
- Tasks, habits, goals and day plans: encrypted database (SQLCipher, file `appdata.db`), a separate random 256-bit key (`app-encryption-key`) in Android secure storage. The old unencrypted file `acexm.db` is copied across once (row counts checked inside one transaction), then deleted; if the copy fails the old file is kept and used, and the move is retried at the next start. Deleting a file does not guarantee the old bytes are overwritten on flash storage. Never logged.
- No accounts, analytics, advertising or network calls for user data.
- Android cloud backup disabled so a restored file can never be paired with a missing key.
- Export files are plain JSON and the user is warned before creating one.
- Erase-all needs two confirmations (a dialog and typing a word).
- No secrets are stored in the repository.
