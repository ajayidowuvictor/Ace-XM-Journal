# Release preparation

Status: **not released.** Nothing has been submitted to any store. The steps that need the owner's own accounts are marked OWNER.

## Before publishing

1. OWNER: finish testing the app on a phone and report problems (see `docs/STATUS.md`).
2. OWNER: create a Google Play Console developer account (one-time registration fee set by Google).
3. OWNER: host the privacy policy at a public web address (a simple page is enough; the text below can be used as a starting point). Play requires the address.
4. Take store screenshots from the finished app (at least two phone screenshots) and make a 1024 x 500 feature graphic. The icon is already derived from the logo.
5. Build the store file: run the "Android preview build" workflow's production equivalent (`eas build --platform android --profile production`), which produces an `.aab`. The profile exists in `eas.json`; it has not been run yet.
6. OWNER: upload the `.aab` to an **internal testing** track first, install from Play, and test again. Only then promote to production.
7. For every later release, raise `android.versionCode` in `app.json` by one.

## Store listing draft

- **Name:** ACE XM JOURNAL
- **Short description (80 characters max):** Plan your day, keep a private journal, and build habits. All on your phone.
- **Full description:**

  ACE XM JOURNAL is a calm, private place to plan, reflect and grow.

  - Tasks with due dates and priorities, and a clear view of today
  - A private journal with mood, tags and search, encrypted on your phone
  - Daily habits with streaks
  - Goals broken into steps, with progress
  - A month calendar and a weekly review
  - Light and dark themes, optional daily reminder
  - No account, no ads, no tracking. Your information stays on your device, and you can export or erase it at any time.

- **Category:** Productivity. **Content rating:** expected to be suitable for all ages (confirm with the rating questionnaire).

## Play "Data safety" answers (to confirm when filling the form)

- Data collected: none. Data shared: none. The app has no accounts and sends nothing to any server.
- Data encryption in transit: not applicable (no data leaves the device).
- Users can request deletion: yes, in-app "Erase all my data", and uninstalling the app removes everything.
- Permissions: notifications (optional, for the daily reminder). Confirm the list in the built app before submitting.

## Privacy policy draft

**Privacy policy for ACE XM JOURNAL**

*Last updated: [date]*

ACE XM JOURNAL ("the app") is designed to keep your information on your own phone.

**What the app stores.** The tasks, habits, goals and journal entries you write, and your settings (such as theme and reminder time). This information is stored only on your device. Journal entries are kept in an encrypted database.

**What the app does not do.** It does not require an account. It does not collect, transmit or share your personal information. It contains no advertising and no analytics or tracking tools.

**Notifications.** If you turn on the daily reminder, the app asks permission to show notifications. The reminder uses a fixed message and does not contain your own words.

**Backups and export.** Cloud backup is disabled for the app. You can create an export file in Settings; the file is not encrypted, and you decide where it is sent or saved.

**Deleting your data.** Use "Erase all my data" in Settings, or uninstall the app. Because nothing is stored elsewhere, deleted data cannot be recovered.

**Children.** The app is not directed at children and does not knowingly collect information from anyone.

**Changes.** If this policy changes, the updated version will be published at this address with a new date.

**Contact.** [contact email address]

## Known limits to mention to testers

- Losing the phone, uninstalling the app or clearing its data loses everything unless an export was made.
- Habits repeat daily only; there are no weekly targets.
- Due dates use quick choices (today, tomorrow, in a week), not a calendar picker.
- Only Android has been built and tested. iOS is planned from the same code.
