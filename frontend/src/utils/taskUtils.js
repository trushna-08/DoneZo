/**
 * Pure functions for task state transformations.
 */

/**
 * Creates a new task and prepends it to the task list.
 * @param {Array} tasks - Current task array.
 * @param {Object} newTaskData - Title and other metadata.
 * @returns {Array} New task list.
 */
export function addTask(tasks, newTaskData) {
  const newTask = {
    id: newTaskData.id || String(Date.now()),
    createdAt: Date.now(),
    status: 'todo',
    priority: 'medium',
    assignee: 'You',
    dueDate: 'Today',
    description: '',
    ...newTaskData
  };
  return [newTask, ...tasks];
}

/**
 * Updates a task in the list with the given changes.
 * @param {Array} tasks - Current task array.
 * @param {string} id - Task ID.
 * @param {Object} changes - Task property changes.
 * @returns {Array} New task list.
 */
export function updateTask(tasks, id, changes) {
  return tasks.map(task => task.id === id ? { ...task, ...changes } : task);
}

/**
 * Filters out a task from the list.
 * @param {Array} tasks - Current task array.
 * @param {string} id - Task ID.
 * @returns {Array} New task list.
 */
export function deleteTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

/**
 * Shorthand for marking a task as done.
 * @param {Array} tasks - Current task array.
 * @param {string} id - Task ID.
 * @returns {Array} New task list.
 */
export function completeTask(tasks, id) {
  return updateTask(tasks, id, { status: 'done', completedAt: Date.now() });
}

/**
 * Filters to active tasks only (todo + in-progress).
 * @param {Array} tasks - Current task array.
 * @returns {Array} Active tasks.
 */
export function getActiveTasks(tasks) {
  return tasks.filter(task => task.status === 'todo' || task.status === 'in-progress');
}

/**
 * Implements the energy-to-priority task matching matrix.
 * @param {Array} tasks - Current task array.
 * @param {string} energy - 'low' | 'medium' | 'high'
 * @returns {Array} Matching tasks.
 */
export function filterByEnergy(tasks, energy) {
  const uncompleted = tasks.filter(task => task.status !== 'done');
  if (energy === 'low') {
    return uncompleted.filter(task => task.priority === 'low' || task.priority === 'medium');
  } else if (energy === 'medium') {
    return uncompleted.filter(task => task.priority === 'medium' || task.priority === 'high');
  } else if (energy === 'high') {
    return uncompleted.filter(task => task.priority === 'high');
  }
  return uncompleted;
}
