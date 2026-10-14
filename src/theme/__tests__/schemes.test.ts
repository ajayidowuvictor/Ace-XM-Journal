import { describe, expect, it } from '@jest/globals';

import { parsePreference, resolveScheme } from '../schemes';

describe('parsePreference', () => {
  it.each(['system', 'light', 'dark'] as const)('accepts %s', (value) => {
    expect(parsePreference(value)).toBe(value);
  });

  it.each([null, undefined, '', 'blue', 'DARK', ' light'])('falls back to system for %p', (raw) => {
    expect(parsePreference(raw)).toBe('system');
  });
});

describe('resolveScheme', () => {
  it('uses the explicit choice regardless of the device setting', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('dark', null)).toBe('dark');
  });

  it('follows the device when set to system', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('shows light when the device setting is unknown', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
    expect(resolveScheme('system', 'unspecified')).toBe('light');
  });
});
