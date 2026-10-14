import { describe, expect, it } from '@jest/globals';

import { newId } from '../id';

describe('newId', () => {
  it('has the UUID v4 format and is different each time', () => {
    const a = newId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newId()).not.toBe(a);
  });
});
