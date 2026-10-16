import { describe, expect, it } from '@jest/globals';

import { daysSinceBackup, describeLastBackup, shouldNudge, snoozeUntil } from '../status';

const NOW = new Date(2026, 9, 16, 12, 0, 0); // 16 Oct 2026, local noon

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('daysSinceBackup', () => {
  it('counts whole days and treats missing or unreadable times as no backup', () => {
    expect(daysSinceBackup(null, NOW)).toBeNull();
    expect(daysSinceBackup('not a time', NOW)).toBeNull();
    expect(daysSinceBackup(daysAgo(0), NOW)).toBe(0);
    expect(daysSinceBackup(daysAgo(6.5), NOW)).toBe(6);
    expect(daysSinceBackup(daysAgo(10), NOW)).toBe(10);
  });

  it('never goes below zero if the clock moved back', () => {
    expect(daysSinceBackup(daysAgo(-2), NOW)).toBe(0);
  });
});

describe('describeLastBackup', () => {
  it('says it plainly', () => {
    expect(describeLastBackup(null, NOW)).toBe('No backup made yet.');
    expect(describeLastBackup(daysAgo(0), NOW)).toBe('Last backup file made today.');
    expect(describeLastBackup(daysAgo(1), NOW)).toBe('Last backup file made yesterday.');
    expect(describeLastBackup(daysAgo(9), NOW)).toBe('Last backup file made 9 days ago.');
  });
});

describe('shouldNudge', () => {
  it('asks when there is data and no backup, or one a week old', () => {
    expect(shouldNudge(null, null, NOW, true)).toBe(true);
    expect(shouldNudge(daysAgo(7), null, NOW, true)).toBe(true);
    expect(shouldNudge(daysAgo(30), null, NOW, true)).toBe(true);
  });

  it('stays quiet with a recent backup or nothing to lose', () => {
    expect(shouldNudge(daysAgo(6), null, NOW, true)).toBe(false);
    expect(shouldNudge(null, null, NOW, false)).toBe(false);
  });

  it('stays quiet until the snooze day, then asks again', () => {
    const until = snoozeUntil(NOW);
    expect(until).toBe('2026-10-19');
    expect(shouldNudge(null, until, NOW, true)).toBe(false);
    expect(shouldNudge(null, '2026-10-16', NOW, true)).toBe(true);
    expect(shouldNudge(null, '2026-10-15', NOW, true)).toBe(true);
  });
});
