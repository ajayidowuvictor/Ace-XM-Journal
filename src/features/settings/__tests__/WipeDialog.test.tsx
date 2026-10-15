import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { WipeDialog, isWipeConfirmed } from '../WipeDialog';

describe('isWipeConfirmed', () => {
  it('accepts the word in any case with spaces, and nothing else', () => {
    expect(isWipeConfirmed('DELETE')).toBe(true);
    expect(isWipeConfirmed('  delete ')).toBe(true);
    expect(isWipeConfirmed('DELET')).toBe(false);
    expect(isWipeConfirmed('')).toBe(false);
  });
});

describe('WipeDialog', () => {
  it('does not erase until the word is typed', async () => {
    const onConfirm = jest.fn();
    await render(<WipeDialog visible onConfirm={onConfirm} onCancel={() => {}} />);

    await fireEvent.press(screen.getByLabelText('Erase all'));
    expect(onConfirm).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Type DELETE'), 'delete');
    await fireEvent.press(screen.getByLabelText('Erase all'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels without erasing', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await render(<WipeDialog visible onConfirm={onConfirm} onCancel={onCancel} />);

    await fireEvent.press(screen.getByLabelText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
