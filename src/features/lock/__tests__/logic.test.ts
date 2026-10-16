import { describe, expect, it } from '@jest/globals';

import {
  NO_ATTEMPTS,
  constantTimeEqual,
  delaySeconds,
  formatWait,
  isValidPin,
  parseAttemptState,
  parseLockDelay,
  recordFailure,
  remainingWaitSeconds,
  shouldLock,
  waitAfterFailures,
} from '../logic';

describe('isValidPin', () => {
  it('accepts exactly six digits', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('000000')).toBe(true);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12345a')).toBe(false);
    expect(isValidPin('12 456')).toBe(false);
    expect(isValidPin('')).toBe(false);
  });
});

describe('lock delay', () => {
  it('reads saved choices and falls back to locking right away', () => {
    expect(parseLockDelay('1m')).toBe('1m');
    expect(parseLockDelay('5m')).toBe('5m');
    expect(parseLockDelay('now')).toBe('now');
    expect(parseLockDelay(null)).toBe('now');
    expect(parseLockDelay('never')).toBe('now');
    expect(delaySeconds('5m')).toBe(300);
  });

  it('locks only after the chosen time away', () => {
    expect(shouldLock(null, 1000, 'now')).toBe(false);
    expect(shouldLock(1000, 1000, 'now')).toBe(true);
    expect(shouldLock(0, 59_000, '1m')).toBe(false);
    expect(shouldLock(0, 60_000, '1m')).toBe(true);
    expect(shouldLock(0, 299_999, '5m')).toBe(false);
    expect(shouldLock(0, 300_000, '5m')).toBe(true);
  });

  it('locks if the clock went backwards', () => {
    expect(shouldLock(10_000, 5_000, '5m')).toBe(true);
  });
});

describe('wrong PIN waits', () => {
  it('allows four wrong tries, then waits longer each time', () => {
    expect([1, 2, 3, 4].map(waitAfterFailures)).toEqual([0, 0, 0, 0]);
    expect(waitAfterFailures(5)).toBe(30);
    expect(waitAfterFailures(6)).toBe(60);
    expect(waitAfterFailures(7)).toBe(300);
    expect(waitAfterFailures(8)).toBe(900);
    expect(waitAfterFailures(40)).toBe(900);
  });

  it('counts failures and sets the time to wait', () => {
    let state = NO_ATTEMPTS;
    for (let i = 0; i < 4; i += 1) state = recordFailure(state, 1_000);
    expect(state).toEqual({ failed: 4, lockedUntil: 0 });
    expect(remainingWaitSeconds(state, 1_000)).toBe(0);

    state = recordFailure(state, 1_000);
    expect(state.failed).toBe(5);
    expect(state.lockedUntil).toBe(31_000);
    expect(remainingWaitSeconds(state, 1_000)).toBe(30);
    expect(remainingWaitSeconds(state, 20_500)).toBe(11);
    expect(remainingWaitSeconds(state, 31_000)).toBe(0);
  });

  it('never asks for more than the longest wait, even if the clock moved back', () => {
    expect(remainingWaitSeconds({ failed: 9, lockedUntil: 10_000_000_000 }, 0)).toBe(900);
  });

  it('reads saved state safely', () => {
    expect(parseAttemptState(null)).toEqual(NO_ATTEMPTS);
    expect(parseAttemptState('not json')).toEqual(NO_ATTEMPTS);
    expect(parseAttemptState('{"failed":-1,"lockedUntil":5}')).toEqual(NO_ATTEMPTS);
    expect(parseAttemptState('{"failed":"x","lockedUntil":5}')).toEqual(NO_ATTEMPTS);
    expect(parseAttemptState('{"failed":3,"lockedUntil":99}')).toEqual({
      failed: 3,
      lockedUntil: 99,
    });
  });
});

describe('formatWait', () => {
  it('reads naturally', () => {
    expect(formatWait(1)).toBe('1 second');
    expect(formatWait(30)).toBe('30 seconds');
    expect(formatWait(60)).toBe('1 minute');
    expect(formatWait(61)).toBe('2 minutes');
    expect(formatWait(900)).toBe('15 minutes');
  });
});

describe('constantTimeEqual', () => {
  it('is true only for identical text', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    expect(constantTimeEqual('', '')).toBe(true);
  });
});
