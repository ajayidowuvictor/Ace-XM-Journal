import { describe, expect, it } from '@jest/globals';

import { migrate, migrations } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';

describe('migrations', () => {
  it('have unique, increasing version numbers starting at 1', () => {
    const versions = migrations.map((m) => m.version);
    expect(versions).toEqual(versions.map((_, i) => i + 1));
  });

  it('create the tasks table on a new database', () => {
    const db = createTestDatabase();
    const version = migrate(db);

    expect(version).toBe(migrations[migrations.length - 1].version);
    const columns = db
      .all<{ name: string }>('PRAGMA table_info(tasks)')
      .map((column) => column.name);
    expect(columns).toEqual(
      expect.arrayContaining(['id', 'title', 'due_date', 'completed_at', 'deleted_at']),
    );
  });

  it('can run again without changing anything', () => {
    const db = createTestDatabase();
    migrate(db);
    db.run(
      `INSERT INTO tasks (id, title, created_at, updated_at) VALUES ('a', 'Keep me', 'x', 'x')`,
    );

    expect(migrate(db)).toBe(migrations.length);
    expect(db.all('SELECT id FROM tasks')).toHaveLength(1);
  });

  it('applies only the newer migrations to an existing database', () => {
    const db = createTestDatabase();
    migrate(db);
    const next = [
      ...migrations,
      { version: migrations.length + 1, sql: 'ALTER TABLE tasks ADD COLUMN extra TEXT' },
    ];

    expect(migrate(db, next)).toBe(next.length);
    expect(db.all<{ name: string }>('PRAGMA table_info(tasks)').map((c) => c.name)).toContain(
      'extra',
    );
  });

  it('leaves the version unchanged when a migration fails', () => {
    const db = createTestDatabase();
    migrate(db);
    const broken = [...migrations, { version: migrations.length + 1, sql: 'NOT VALID SQL' }];

    expect(() => migrate(db, broken)).toThrow();
    expect(db.first<{ user_version: number }>('PRAGMA user_version')?.user_version).toBe(
      migrations.length,
    );
  });

  it('keeps existing tasks when a database from the first version is upgraded', () => {
    const db = createTestDatabase();
    migrate(db, migrations.slice(0, 1));
    db.run(
      `INSERT INTO tasks (id, title, created_at, updated_at) VALUES ('a', 'Old task', 'x', 'x')`,
    );

    expect(migrate(db)).toBe(migrations.length);
    expect(db.first<{ title: string }>(`SELECT title FROM tasks WHERE id = 'a'`)?.title).toBe(
      'Old task',
    );
    expect(db.all(`SELECT * FROM habits`)).toEqual([]);
  });
});
