import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { Text } from '../Text';
import { maxFontScale } from '../tokens';

describe('large text', () => {
  it('lets text grow but not without limit', async () => {
    await render(<Text>Hello</Text>);
    expect(screen.getByText('Hello').props.maxFontSizeMultiplier).toBe(maxFontScale.normal);
    expect(maxFontScale.normal).toBeGreaterThanOrEqual(1.5);
  });

  it('allows a caller to set its own limit, and keeps symbols in small boxes small', async () => {
    await render(<Text maxFontSizeMultiplier={maxFontScale.glyph}>✓</Text>);
    expect(screen.getByText('✓').props.maxFontSizeMultiplier).toBe(maxFontScale.glyph);
    expect(maxFontScale.glyph).toBeLessThan(maxFontScale.normal);
  });
});
