import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { PinPad } from '../PinPad';

function Harness({ onComplete }: { onComplete: (pin: string) => void }) {
  const [value, setValue] = useState('');
  return <PinPad value={value} onChange={setValue} onComplete={onComplete} />;
}

async function typeDigits(digits: string) {
  for (const digit of digits) {
    await fireEvent.press(screen.getByLabelText(digit));
  }
}

describe('PinPad', () => {
  it('reports the PIN once six digits are entered', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);

    await typeDigits('12345');
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByLabelText('5 of 6 digits entered')).toBeTruthy();

    await typeDigits('6');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('ignores digits after the sixth', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);
    await typeDigits('1234567');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('deletes the last digit', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);
    await typeDigits('12');
    await fireEvent.press(screen.getByLabelText('Delete last digit'));
    expect(screen.getByLabelText('1 of 6 digits entered')).toBeTruthy();
    await typeDigits('23456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('does nothing while disabled', async () => {
    const onChange = jest.fn();
    await render(<PinPad value="" onChange={onChange} onComplete={() => {}} disabled />);
    await fireEvent.press(screen.getByLabelText('1'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows an extra key, such as the fingerprint, and calls it', async () => {
    const onPress = jest.fn();
    await render(
      <PinPad
        value=""
        onChange={() => {}}
        onComplete={() => {}}
        extraKey={{ label: 'F', accessibilityLabel: 'Use fingerprint', onPress }}
      />,
    );
    await fireEvent.press(screen.getByLabelText('Use fingerprint'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
