import { Pressable } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { Button, Card, EmptyState, ErrorState, ProgressBar, Text } from '../../ui';
import { useTasks } from '../tasks/TasksContext';
import { useGoals } from './GoalsContext';
import { goalProgress, milestoneCounts, sortGoals, taskCounts, tasksForGoal } from './logic';
import { useGoalEditor } from './useGoalEditor';

export function GoalsPanel() {
  const { goals, error } = useGoals();
  const { tasks } = useTasks();
  const editor = useGoalEditor();

  return (
    <>
      <Button label="New goal" onPress={() => editor.open(null)} />

      {error ? <ErrorState message={error} /> : null}

      {goals.length === 0 && !error ? (
        <EmptyState
          title="No goals yet"
          message="Set a goal, break it into steps and watch your progress grow."
          actionLabel="Add a goal"
          onAction={() => editor.open(null)}
        />
      ) : null}

      {sortGoals(goals).map((goal) => {
        const linked = tasksForGoal(tasks, goal.id);
        const progress = goalProgress(goal, linked);
        const steps = milestoneCounts(goal);
        const linkedCounts = taskCounts(linked);
        const details = [
          goal.completedAt ? 'Achieved' : null,
          steps.total > 0 ? `${steps.done} of ${steps.total} steps` : null,
          linkedCounts.total > 0
            ? `${linkedCounts.done} of ${linkedCounts.total} ${linkedCounts.total === 1 ? 'task' : 'tasks'}`
            : null,
          goal.targetDate ? `Target ${formatShortDate(goal.targetDate)}` : null,
        ].filter((part): part is string => part !== null);

        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`Open goal: ${goal.title}`}
            onPress={() => editor.open(goal.id)}
          >
            <Card>
              <Text variant="heading">{goal.title}</Text>
              {details.length > 0 ? (
                <Text variant="caption" muted>
                  {details.join('  ·  ')}
                </Text>
              ) : null}
              <ProgressBar
                value={progress}
                accessibilityLabel={`${goal.title}: ${Math.round(progress * 100)} percent`}
              />
            </Card>
          </Pressable>
        );
      })}

      {editor.element}
    </>
  );
}
