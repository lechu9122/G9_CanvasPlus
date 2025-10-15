/**
 * Lane Allocation Utility for Daily Schedule Widget
 * 
 * Uses an O(n log n) sweep algorithm with interval graph to assign lanes
 * to overlapping tasks, ensuring they render side-by-side without visual overlap.
 * 
 * Algorithm:
 * 1. Sort tasks by start time, then by end time
 * 2. Maintain active tasks (tasks currently overlapping)
 * 3. Assign each task the lowest available lane index
 * 4. Group tasks into clusters (connected components in overlap graph)
 * 5. Track max lanes within each cluster for proper width calculation
 */

/**
 * Check if two tasks overlap in time
 * @param {Object} a - First task with start and end
 * @param {Object} b - Second task with start and end
 * @returns {boolean} True if tasks overlap
 */
function tasksOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Allocate lanes to tasks using sweep algorithm
 * @param {Array} tasks - Array of tasks with {id, start, end, ...}
 * @returns {Array} Tasks with added {lane, clusterId, clusterMaxLanes}
 */
export function allocateLanes(tasks) {
  if (!tasks || tasks.length === 0) return [];

  // Step 1: Sort tasks by start time, then by end time
  const sorted = [...tasks].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });

  // Step 2: Sweep algorithm to assign lanes
  const result = [];
  const activeTasks = []; // Tasks currently overlapping: [{task, lane, endTime}]

  for (const task of sorted) {
    // Remove tasks that have ended before this task starts
    const stillActive = activeTasks.filter(active => active.endTime > task.start);
    activeTasks.length = 0;
    activeTasks.push(...stillActive);

    // Find the lowest available lane
    const usedLanes = new Set(activeTasks.map(active => active.lane));
    let lane = 0;
    while (usedLanes.has(lane)) {
      lane++;
    }

    // Add this task to active list
    const taskWithLane = { ...task, lane };
    activeTasks.push({ task: taskWithLane, lane, endTime: task.end });
    result.push(taskWithLane);
  }

  // Step 3: Build overlap graph and find clusters (connected components)
  const clusters = [];
  const taskToCluster = new Map();

  for (let i = 0; i < result.length; i++) {
    if (taskToCluster.has(result[i].id)) continue;

    // Start a new cluster with BFS
    const cluster = [];
    const queue = [result[i]];
    const visited = new Set([result[i].id]);

    while (queue.length > 0) {
      const current = queue.shift();
      cluster.push(current);
      taskToCluster.set(current.id, clusters.length);

      // Find all overlapping tasks
      for (const other of result) {
        if (!visited.has(other.id) && tasksOverlap(current, other)) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }

    clusters.push(cluster);
  }

  // Step 4: Calculate max lanes for each cluster
  const clusterMaxLanes = clusters.map(cluster => {
    return Math.max(...cluster.map(t => t.lane)) + 1;
  });

  // Step 5: Add cluster info to each task
  return result.map(task => ({
    ...task,
    clusterId: taskToCluster.get(task.id),
    clusterMaxLanes: clusterMaxLanes[taskToCluster.get(task.id)]
  }));
}

/**
 * Compute layout properties for tasks with lane allocation
 * @param {Array} tasks - Tasks with lane allocation
 * @param {number} dayMinutes - Total minutes in the day (e.g., 1440 for 24h)
 * @param {number} containerWidth - Width of the container in pixels
 * @param {number} gutterPx - Horizontal gutter between lanes in pixels (default: 4)
 * @returns {Array} Tasks with added layout properties {topPx, heightPx, leftPx, widthPx}
 */
export function computeTaskLayout(tasks, dayMinutes, containerWidth, pxPerMinute, gutterPx = 4) {
  return tasks.map(task => {
    const { start, end, lane, clusterMaxLanes } = task;

    // Vertical positioning
    const topPx = start * pxPerMinute;
    const heightPx = Math.max(44, (end - start) * pxPerMinute); // Min height 44px

    // Horizontal positioning within cluster
    const laneWidthPx = containerWidth / clusterMaxLanes;
    const leftPx = lane * laneWidthPx;
    const widthPx = laneWidthPx - gutterPx;

    return {
      ...task,
      layout: {
        topPx,
        heightPx,
        leftPx,
        widthPx: Math.max(60, widthPx) // Min width 60px for readability
      }
    };
  });
}

/**
 * Complete lane allocation and layout computation
 * @param {Array} tasks - Raw tasks
 * @param {number} dayMinutes - Total minutes in day
 * @param {number} containerWidth - Container width in px
 * @param {number} pxPerMinute - Pixels per minute scale factor
 * @param {number} gutterPx - Gutter between lanes
 * @returns {Array} Tasks with lane and layout info
 */
export function computeTaskLayoutWithLanes(tasks, dayMinutes, containerWidth, pxPerMinute, gutterPx = 4) {
  const tasksWithLanes = allocateLanes(tasks);
  return computeTaskLayout(tasksWithLanes, dayMinutes, containerWidth, pxPerMinute, gutterPx);
}
