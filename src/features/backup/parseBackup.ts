import { daysFromText } from '../habits/logic';
import { toReminderTime, toRepeatRule, toTaskCategory } from '../tasks/repeat';
import type { Priority } from '../tasks/types';
import type { Mood } from '../journal/types';
import type { NoteKind } from '../notes/types';
import type { BackupData } from './types';

class Invalid extends Error {}

type Obj = Record<string, unknown>;

function obj(value: unknown): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Invalid();
  return value as Obj;
}

function list(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Invalid();
  return value;
}

function text(value: unknown, fallback?: string): string {
  if (typeof value === 'string') return value;
  if (value === undefined && fallback !== undefined) return fallback;
  throw new Invalid();
}

function id(value: unknown): string {
  const result = text(value);
  if (!result) throw new Invalid();
  return result;
}

function textOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return text(value);
}

function whole(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Invalid();
  return value;
}

function texts(value: unknown): string[] {
  return list(value).map((item) => text(item));
}

/**
 * Reads the text of an export (the data inside a backup) and checks every record. Returns null if
 * anything is missing or the wrong shape, so a damaged file is never half-restored.
 */
export function parseBackupData(jsonText: string): BackupData | null {
  try {
    const root = obj(JSON.parse(jsonText));
    if (root.app !== 'ACE XM JOURNAL') return null;

    const plans = root.dayPlans === undefined ? {} : obj(root.dayPlans);

    return {
      tasks: list(root.tasks).map((raw) => {
        const t = obj(raw);
        const createdAt = text(t.createdAt);
        const priority = whole(t.priority ?? 0);
        return {
          id: id(t.id),
          title: text(t.title),
          notes: text(t.notes, ''),
          dueDate: textOrNull(t.dueDate),
          priority: (priority >= 0 && priority <= 3 ? priority : 0) as Priority,
          repeat: toRepeatRule(t.repeat),
          reminderTime: toReminderTime(t.reminderTime),
          category: toTaskCategory(t.category),
          completedAt: textOrNull(t.completedAt),
          createdAt,
          updatedAt: text(t.updatedAt, createdAt),
        };
      }),
      habits: list(root.habits).map((raw) => {
        const h = obj(raw);
        return {
          id: id(h.id),
          name: text(h.name),
          completedDates: texts(h.completedDates),
          // Older backups have no days; a habit without them repeats every day.
          days: daysFromText(Array.isArray(h.days) ? h.days.join('') : ''),
          createdAt: text(h.createdAt),
        };
      }),
      goals: list(root.goals).map((raw) => {
        const g = obj(raw);
        const goalId = id(g.id);
        return {
          id: goalId,
          title: text(g.title),
          notes: text(g.notes, ''),
          targetDate: textOrNull(g.targetDate),
          completedAt: textOrNull(g.completedAt),
          createdAt: text(g.createdAt),
          milestones: list(g.milestones).map((rawStep) => {
            const m = obj(rawStep);
            return {
              id: id(m.id),
              goalId,
              title: text(m.title),
              completedAt: textOrNull(m.completedAt),
            };
          }),
        };
      }),
      entries: list(root.journalEntries).map((raw) => {
        const e = obj(raw);
        const createdAt = text(e.createdAt);
        const mood = e.mood === undefined || e.mood === null ? null : whole(e.mood);
        return {
          id: id(e.id),
          entryDate: text(e.entryDate),
          title: text(e.title, ''),
          body: text(e.body, ''),
          mood: (mood !== null && mood >= 1 && mood <= 5 ? mood : null) as Mood | null,
          tags: texts(e.tags),
          createdAt,
          updatedAt: text(e.updatedAt, createdAt),
        };
      }),
      focus: list(plans.focus).map((raw) => {
        const f = obj(raw);
        return { planDate: text(f.planDate), taskId: id(f.taskId), position: whole(f.position) };
      }),
      blocks: list(plans.blocks).map((raw) => {
        const b = obj(raw);
        const createdAt = text(b.createdAt);
        return {
          id: id(b.id),
          planDate: text(b.planDate),
          title: text(b.title),
          taskId: textOrNull(b.taskId),
          startMinutes: whole(b.startMinutes),
          durationMinutes: whole(b.durationMinutes),
          createdAt,
          updatedAt: text(b.updatedAt, createdAt),
        };
      }),
      notebooks: list(root.notebooks).map((raw) => {
        const n = obj(raw);
        const createdAt = text(n.createdAt);
        return {
          id: id(n.id),
          name: text(n.name),
          createdAt,
          updatedAt: text(n.updatedAt, createdAt),
        };
      }),
      notes: list(root.notes).map((raw) => {
        const n = obj(raw);
        const createdAt = text(n.createdAt);
        const kind = n.kind === 'verse' || n.kind === 'text' ? n.kind : 'note';
        return {
          id: id(n.id),
          notebookId: textOrNull(n.notebookId),
          kind: kind as NoteKind,
          title: text(n.title, ''),
          body: text(n.body, ''),
          reference: text(n.reference, ''),
          pinned: n.pinned === true,
          createdAt,
          updatedAt: text(n.updatedAt, createdAt),
        };
      }),
    };
  } catch {
    return null;
  }
}

/** Counts for the "this backup contains" summary. */
export function summarizeBackup(data: BackupData): string {
  const parts: [number, string, string][] = [
    [data.tasks.length, 'task', 'tasks'],
    [data.habits.length, 'habit', 'habits'],
    [data.goals.length, 'goal', 'goals'],
    [data.entries.length, 'journal entry', 'journal entries'],
    [data.notes.length, 'note', 'notes'],
  ];
  const nonEmpty = parts.filter(([count]) => count > 0);
  if (nonEmpty.length === 0) return 'nothing yet';
  return nonEmpty.map(([count, one, many]) => `${count} ${count === 1 ? one : many}`).join(', ');
}
