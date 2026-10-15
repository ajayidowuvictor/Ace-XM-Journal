import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  dayInfo,
  hasActivity,
  monthGrid,
  shiftMonth,
  WEEKDAY_LABELS,
} from '@/features/calendar/logic';
import { useHabits } from '@/features/habits/HabitsContext';
import { useJournal } from '@/features/journal/JournalContext';
import { entryHeadline } from '@/features/journal/logic';
import { useTasks } from '@/features/tasks/TasksContext';
import { parseLocalDate, toLocalDateString } from '@/lib/dates';
import { formatLongDate } from '@/lib/greeting';
import { useTheme } from '@/theme/context';
import { Button, Card, Screen, Text, minTouchTarget, radius, spacing } from '@/ui';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { allEntries } = useJournal();

  const today = toLocalDateString(new Date());
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });
  const [selected, setSelected] = useState(today);

  const inputs = { tasks, habits, entries: allEntries };
  const weeks = monthGrid(view.year, view.monthIndex);
  const monthTitle = new Date(view.year, view.monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const selectedDate = parseLocalDate(selected);
  const info = dayInfo(selected, inputs);
  const dayTasks = tasks.filter((task) => task.dueDate === selected);
  const dayHabits = habits.filter((habit) => habit.completedDates.includes(selected));
  const dayEntries = allEntries.filter((entry) => entry.entryDate === selected);

  return (
    <Screen>
      <Button label="Back" variant="ghost" onPress={() => router.back()} style={styles.back} />
      <Text variant="title">Calendar</Text>

      <View style={styles.monthRow}>
        <Button
          label="Previous"
          variant="secondary"
          onPress={() => setView(shiftMonth(view.year, view.monthIndex, -1))}
        />
        <Text variant="heading" style={styles.monthTitle}>
          {monthTitle}
        </Text>
        <Button
          label="Next"
          variant="secondary"
          onPress={() => setView(shiftMonth(view.year, view.monthIndex, 1))}
        />
      </View>

      <Card>
        <View style={styles.week}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={styles.cell}>
              <Text variant="caption" muted>
                {label}
              </Text>
            </View>
          ))}
        </View>
        {weeks.map((week, index) => (
          <View key={index} style={styles.week}>
            {week.map((date, column) => {
              if (!date) return <View key={column} style={styles.cell} />;
              const active = hasActivity(dayInfo(date, inputs));
              const isSelected = date === selected;
              const isToday = date === today;
              return (
                <Pressable
                  key={column}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatLongDate(parseLocalDate(date) ?? new Date())}${active ? ', has activity' : ''}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(date)}
                  style={[
                    styles.cell,
                    styles.day,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isToday ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: isSelected ? colors.onPrimary : colors.text }}>
                    {Number(date.slice(8))}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: active
                          ? isSelected
                            ? colors.onPrimary
                            : colors.success
                          : 'transparent',
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="heading">{selectedDate ? formatLongDate(selectedDate) : selected}</Text>
        {!hasActivity(info) ? <Text muted>Nothing on this day.</Text> : null}

        {dayTasks.map((task) => (
          <Text key={task.id} muted={task.completedAt !== null}>
            {task.completedAt ? '✓ ' : '• '}
            {task.title}
          </Text>
        ))}
        {dayHabits.map((habit) => (
          <Text key={habit.id}>✓ {habit.name}</Text>
        ))}
        {dayEntries.map((entry) => (
          <Pressable
            key={entry.id}
            accessibilityRole="button"
            accessibilityLabel={`Open journal entry: ${entryHeadline(entry)}`}
            onPress={() => router.push({ pathname: '/entry', params: { id: entry.id } })}
          >
            <Text>Journal: {entryHeadline(entry)}</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  monthTitle: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: minTouchTarget },
  day: { borderRadius: radius.md, borderWidth: 2, gap: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
