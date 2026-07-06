export function detectFriction(tasks) {
  if (!tasks || !Array.isArray(tasks)) return [];

  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  const alerts = [];

  for (const task of tasks) {
    if (task.status === 'in-progress' || task.status === 'todo') {
      const dateToUse = task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt);
      
      // If date is invalid or missing, fallback to current to avoid crashing
      if (isNaN(dateToUse.getTime())) continue;

      const timeDiff = now - dateToUse.getTime();

      if (timeDiff > FORTY_EIGHT_HOURS_MS) {
        const hoursStuck = Math.floor(timeDiff / (1000 * 60 * 60));
        let frictionType = 'dependency';

        const hasNoTags = !task.tags || task.tags.length === 0;
        const hasNoDescription = !task.description || task.description.trim() === '';

        if (hasNoDescription && hasNoTags) {
          frictionType = 'unclear';
        } else if (task.priority === 'high' && hoursStuck > 72) {
          frictionType = 'overscoped';
        }

        let suggestedFlowchart = 'decision';
        if (frictionType === 'unclear') {
          suggestedFlowchart = 'unblock';
        } else if (frictionType === 'overscoped') {
          suggestedFlowchart = 'lifecycle';
        }

        alerts.push({
          task,
          hoursStuck,
          frictionType,
          suggestedFlowchart
        });
      }
    }
  }

  // Sort alerts by hours stuck (descending)
  return alerts.sort((a, b) => b.hoursStuck - a.hoursStuck);
}

export function getSeverity(hoursStuck) {
  if (hoursStuck > 120) return 'critical';
  if (hoursStuck > 72) return 'warning';
  return 'notice';
}
