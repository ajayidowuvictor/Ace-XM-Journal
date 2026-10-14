import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createAutosaver } from '../autosave';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('createAutosaver', () => {
  it('saves once after typing pauses, not on every edit', () => {
    const save = jest.fn();
    const saver = createAutosaver(save, 800);

    saver.schedule();
    jest.advanceTimersByTime(500);
    saver.schedule();
    jest.advanceTimersByTime(500);
    expect(save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush saves a waiting edit immediately, once', () => {
    const save = jest.fn();
    const saver = createAutosaver(save, 800);

    saver.schedule();
    saver.flush();
    jest.advanceTimersByTime(2000);

    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush does nothing when no edit is waiting', () => {
    const save = jest.fn();
    createAutosaver(save).flush();
    expect(save).not.toHaveBeenCalled();
  });

  it('cancel drops a waiting save', () => {
    const save = jest.fn();
    const saver = createAutosaver(save, 800);

    saver.schedule();
    saver.cancel();
    jest.advanceTimersByTime(2000);

    expect(save).not.toHaveBeenCalled();
  });
});
