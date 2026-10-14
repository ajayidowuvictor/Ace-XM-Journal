import { describe, expect, it } from '@jest/globals';

import { startRoute } from '../startRoute';

describe('startRoute', () => {
  it('opens the first-run screen until onboarding is complete', () => {
    expect(startRoute(false)).toBe('/onboarding');
  });

  it('opens the Home tab once onboarding is complete', () => {
    expect(startRoute(true)).toBe('/home');
  });
});
