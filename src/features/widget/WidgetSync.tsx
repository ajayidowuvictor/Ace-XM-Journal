import { useEffect } from 'react';

import { toLocalDateString } from '../../lib/dates';
import { updateTodayWidget } from '../../lib/todayWidget';
import { useNow } from '../../lib/useNow';
import { usePlanner } from '../planner/PlannerContext';
import { minutesOfDay } from '../planner/logic';
import { useTasks } from '../tasks/TasksContext';
import { buildWidgetPayload } from './logic';
import { useWidgetNames } from './widgetNames';

/** Keeps the home-screen widget's text current. Shows nothing itself. */
export function WidgetSync() {
  const { tasks } = useTasks();
  const { focus, blocks } = usePlanner();
  const names = useWidgetNames();
  const now = useNow();

  useEffect(() => {
    updateTodayWidget(
      buildWidgetPayload({
        today: toLocalDateString(now),
        nowMinutes: minutesOfDay(now),
        tasks,
        focus,
        blocks,
        names,
      }),
    );
  }, [tasks, focus, blocks, names, now]);

  return null;
}
