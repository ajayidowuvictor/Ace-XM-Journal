import { describe, expect, it } from '@jest/globals';

import { ENTRY_TEMPLATES, NOTE_TEMPLATES, canApplyTemplate } from '../logic';

describe('templates', () => {
  it('each list has unique ids and labels, and every template has text to start from', () => {
    for (const list of [ENTRY_TEMPLATES, NOTE_TEMPLATES]) {
      expect(new Set(list.map((t) => t.id)).size).toBe(list.length);
      expect(new Set(list.map((t) => t.label)).size).toBe(list.length);
      for (const template of list) {
        expect(template.label.trim()).not.toBe('');
        expect(template.body.trim()).not.toBe('');
      }
    }
  });

  it('is offered only on a blank page', () => {
    expect(canApplyTemplate('', '')).toBe(true);
    expect(canApplyTemplate('  ', '\n ')).toBe(true);
    expect(canApplyTemplate('A title', '')).toBe(false);
    expect(canApplyTemplate('', 'Some words')).toBe(false);
  });
});
