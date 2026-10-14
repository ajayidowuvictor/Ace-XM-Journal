import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { clampProgress } from '../ProgressBar';
import { SegmentedControl } from '../SegmentedControl';
import { TextField } from '../TextField';
import { EmptyState, ErrorState } from '../states';

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ignores presses while loading, which prevents duplicate submissions', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} loading />);
    expect(screen.queryByText('Save')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('shows the message and runs the action', async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState
        title="No tasks"
        message="Add your first task."
        actionLabel="Add task"
        onAction={onAction}
      />,
    );
    expect(screen.getByText('No tasks')).toBeTruthy();
    expect(screen.getByText('Add your first task.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Add task'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows no button when there is no action', async () => {
    await render(<EmptyState title="Empty" message="Nothing here." />);
    expect(screen.queryByLabelText('Add task')).toBeNull();
  });
});

describe('ErrorState', () => {
  it('shows the message and offers a retry', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Could not load." onRetry={onRetry} />);
    expect(screen.getByText('Could not load.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ConfirmDialog', () => {
  it('shows nothing when not visible', async () => {
    await render(
      <ConfirmDialog
        visible={false}
        title="Delete entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.queryByText('Delete entry?')).toBeNull();
  });

  it('confirms and cancels through separate buttons', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await render(
      <ConfirmDialog
        visible
        destructive
        title="Delete entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('Delete entry?')).toBeTruthy();

    await fireEvent.press(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('SegmentedControl', () => {
  it('reports the chosen option', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        accessibilityLabel="Appearance"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value="light"
        onChange={onChange}
      />,
    );
    await fireEvent.press(screen.getByText('Dark'));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});

describe('TextField', () => {
  it('shows its label and an error message', async () => {
    await render(<TextField label="Title" value="" onChangeText={jest.fn()} error="Required" />);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Required')).toBeTruthy();
  });
});

describe('clampProgress', () => {
  it.each([
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [-1, 0],
    [2, 1],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])('%p becomes %p', (input, expected) => {
    expect(clampProgress(input)).toBe(expected);
  });
});
