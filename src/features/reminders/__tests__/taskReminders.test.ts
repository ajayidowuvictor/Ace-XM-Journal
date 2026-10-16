import { describe, expect, it } from '@jest/globals';

import type { Task } from '../../tasks/types';
import {
  MAX_TASK_REMINDERS,
  TASK_REMINDER_HIDDEN_BODY,
  TASK_REMINDER_TITLE,
  parseTaskNameChoice,
  planTaskReminders,
  reminderChoiceFor,
  reminderMoment,
  taskReminderContent,
} from '../taskReminders';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Private task ${id}`,
    notes: '',
    dueDate: '2026-10-20',
    priority: 0,
    repeat: 'none',
    reminderTime: '08:30',
    completedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date(2026, 9, 16, 12, 0);

describe('reminderMoment', () => {
  it('is the due date at the reminder time in local time', () => {
    expect(reminderMoment(task('a'), NOW)).toEqual(new Date(2026, 9, 20, 8, 30));
  });

  it('is nothing for done tasks, missing date or time, or a time already passed', () => {
    expect(reminderMoment(task('a', { completedAt: '2026-10-15T00:00:00.000Z' }), NOW)).toBeNull();
    expect(reminderMoment(task('a', { dueDate: null }), NOW)).toBeNull();
    expect(reminderMoment(task('a', { reminderTime: null }), NOW)).toBeNull();
    expect(
      reminderMoment(task('a', { dueDate: '2026-10-16', reminderTime: '09:00' }), NOW),
    ).toBeNull();
    expect(
      reminderMoment(task('a', { dueDate: '2026-10-16', reminderTime: '12:00' }), NOW),
    ).toBeNull();
    expect(
      reminderMoment(task('a', { dueDate: '2026-10-16', reminderTime: '12:01' }), NOW),
    ).toEqual(new Date(2026, 9, 16, 12, 1));
  });

  it('is nothing for damaged dates or times', () => {
    expect(reminderMoment(task('a', { dueDate: 'soon' }), NOW)).toBeNull();
    expect(reminderMoment(task('a', { reminderTime: '8am' }), NOW)).toBeNull();
  });
});

describe('planTaskReminders', () => {
  it('lists the nearest first and skips tasks without a reminder', () => {
    const planned = planTaskReminders(
      [
        task('late', { dueDate: '2026-10-25' }),
        task('none', { reminderTime: null }),
        task('soon', { dueDate: '2026-10-17' }),
      ],
      NOW,
    );
    expect(planned.map((item) => item.taskId)).toEqual(['soon', 'late']);
  });

  it('keeps only the nearest ones when there are too many', () => {
    const many = Array.from({ length: MAX_TASK_REMINDERS + 10 }, (_, index) =>
      task(`t${String(index).padStart(3, '0')}`, {
        dueDate: `2027-01-${String((index % 28) + 1).padStart(2, '0')}`,
      }),
    );
    expect(planTaskReminders(many, NOW)).toHaveLength(MAX_TASK_REMINDERS);
    expect(planTaskReminders(many, NOW, 3)).toHaveLength(3);
  });
});

describe('reminder wording', () => {
  it('does not include the task by default', () => {
    const content = taskReminderContent('Call the doctor', 'hidden');
    expect(content).toEqual({ title: TASK_REMINDER_TITLE, body: TASK_REMINDER_HIDDEN_BODY });
    expect(JSON.stringify(content)).not.toContain('doctor');
  });

  it('shows the task name only when the person chose that', () => {
    expect(taskReminderContent('Call the doctor', 'shown').title).toBe('Call the doctor');
  });

  it('reads the saved choice and falls back to hidden', () => {
    expect(parseTaskNameChoice('shown')).toBe('shown');
    expect(parseTaskNameChoice('anything')).toBe('hidden');
    expect(parseTaskNameChoice(null)).toBe('hidden');
  });

  it('maps a stored time to a form choice', () => {
    expect(reminderChoiceFor(null)).toBe('off');
    expect(reminderChoiceFor('17:00')).toBe('17:00');
  });
});
