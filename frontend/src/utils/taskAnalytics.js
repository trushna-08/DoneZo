import { format, subDays, isAfter, startOfDay, differenceInHours } from 'date-fns';

export function computeStats(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      avgCompletionTime: 0
    };
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  
  const now = new Date();
  const overdueTasks = tasks.filter(t => t.dueDate && t.status !== 'done' && isAfter(now, startOfDay(new Date(t.dueDate)))).length;

  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  const doneTasksWithDates = tasks.filter(t => t.status === 'done' && t.createdAt && t.completedAt);
  let totalHours = 0;
  doneTasksWithDates.forEach(t => {
    totalHours += differenceInHours(new Date(t.completedAt), new Date(t.createdAt));
  });
  const avgCompletionTime = doneTasksWithDates.length > 0 ? Math.round(totalHours / doneTasksWithDates.length) : 0;

  return { totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate, avgCompletionTime };
}

export function groupByDay(tasks, field, days) {
  const result = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'MMM dd');
    
    // Filter tasks where the relevant date (e.g., completedAt) matches the date 'd'
    const count = tasks.filter(t => {
      const taskDate = t[field];
      if (!taskDate) return false;
      return format(new Date(taskDate), 'MMM dd') === dateStr;
    }).length;
    
    result.push({ date: dateStr, count });
  }
  
  return result;
}

export function getStalledTasks(tasks) {
  return tasks
    .filter(t => t.status === 'todo' || t.status === 'in-progress')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function computeInsights(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      peakDay: 'None',
      mostBlockedPriority: 'None',
      daysToComplete: 0
    };
  }

  // Peak productivity day (last 7 days completedAt)
  const completedByDay = groupByDay(tasks, 'completedAt', 7);
  let maxCount = 0;
  let peakDay = 'None';
  completedByDay.forEach(day => {
    if (day.count > maxCount) {
      maxCount = day.count;
      peakDay = day.date;
    }
  });

  // Most blocked priority level
  const stalled = getStalledTasks(tasks);
  const priorityCounts = { low: 0, medium: 0, high: 0 };
  stalled.forEach(t => {
    if (priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }
  });
  let mostBlockedPriority = 'None';
  let maxPriorityCount = 0;
  Object.keys(priorityCounts).forEach(p => {
    if (priorityCounts[p] > maxPriorityCount) {
      maxPriorityCount = priorityCounts[p];
      mostBlockedPriority = p;
    }
  });

  // Estimated days to clear backlog at current 7-day velocity
  const totalCompletedLast7Days = completedByDay.reduce((sum, day) => sum + day.count, 0);
  const velocityPerDay = totalCompletedLast7Days / 7;
  const backlogCount = tasks.length - tasks.filter(t => t.status === 'done').length;
  
  let daysToComplete = 0;
  if (velocityPerDay > 0) {
    daysToComplete = Math.ceil(backlogCount / velocityPerDay);
  } else if (backlogCount > 0) {
    daysToComplete = 'Infinity'; 
  }

  return { peakDay, mostBlockedPriority, daysToComplete };
}

export function buildMindMapData(tasks) {
  const center = { id: 'center', label: 'All Tasks', priority: 'medium' };
  const tagsMap = {};

  tasks.forEach(task => {
    const tags = task.tags && task.tags.length > 0 ? task.tags : ['Untagged'];
    tags.forEach(tag => {
      if (!tagsMap[tag]) {
        tagsMap[tag] = { label: tag, color: '#6366f1', children: [] };
      }
      tagsMap[tag].children.push({ id: task.id, label: task.title, priority: task.priority });
    });
  });

  return {
    center,
    branches: Object.values(tagsMap)
  };
}
