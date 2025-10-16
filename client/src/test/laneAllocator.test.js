/**
 * Unit Tests for Lane Allocator
 * 
 * Tests the O(n log n) sweep algorithm for assigning lanes to overlapping tasks.
 */

import { describe, it, expect } from 'vitest';
import { allocateLanes, computeTaskLayout, computeTaskLayoutWithLanes } from '../utils/laneAllocator';

describe('Lane Allocator', () => {
  describe('allocateLanes', () => {
    it('should handle empty array', () => {
      const result = allocateLanes([]);
      expect(result).toEqual([]);
    });

    it('should handle single task', () => {
      const tasks = [{ id: '1', title: 'Task 1', start: 60, end: 120 }];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(1);
      expect(result[0].lane).toBe(0);
      expect(result[0].clusterMaxLanes).toBe(1);
    });

    it('should handle non-overlapping tasks (same lane)', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 120, end: 180 },
        { id: '3', title: 'Task 3', start: 180, end: 240 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(3);
      // All should be in lane 0 since they don't overlap
      expect(result.every(t => t.lane === 0)).toBe(true);
      expect(result.every(t => t.clusterMaxLanes === 1)).toBe(true);
    });

    it('should handle two overlapping tasks (side by side)', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 90, end: 150 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(2);
      expect(result[0].lane).toBe(0);
      expect(result[1].lane).toBe(1); // Second task gets lane 1
      expect(result.every(t => t.clusterMaxLanes === 2)).toBe(true);
    });

    it('should handle triple overlapping tasks', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 180 },
        { id: '2', title: 'Task 2', start: 90, end: 150 },
        { id: '3', title: 'Task 3', start: 120, end: 210 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(3);
      expect(result[0].lane).toBe(0);
      expect(result[1].lane).toBe(1);
      expect(result[2].lane).toBe(2);
      expect(result.every(t => t.clusterMaxLanes === 3)).toBe(true);
    });

    it('should reuse lanes when tasks end', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 90, end: 150 },
        { id: '3', title: 'Task 3', start: 130, end: 190 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(3);
      expect(result[0].lane).toBe(0);
      expect(result[1].lane).toBe(1);
      // Task 3 should reuse lane 0 since Task 1 has ended
      expect(result[2].lane).toBe(0);
    });

    it('should handle back-to-back tasks (end == start)', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 120, end: 180 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(2);
      // Back-to-back tasks should be in the same lane (no overlap)
      expect(result.every(t => t.lane === 0)).toBe(true);
    });

    it('should handle large clique (many overlapping)', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 180 },
        { id: '2', title: 'Task 2', start: 70, end: 190 },
        { id: '3', title: 'Task 3', start: 80, end: 200 },
        { id: '4', title: 'Task 4', start: 90, end: 210 },
        { id: '5', title: 'Task 5', start: 100, end: 220 },
        { id: '6', title: 'Task 6', start: 110, end: 230 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(6);
      // All tasks should have unique lanes
      const lanes = result.map(t => t.lane);
      expect(new Set(lanes).size).toBe(6);
      expect(result.every(t => t.clusterMaxLanes === 6)).toBe(true);
    });

    it('should handle multiple separate clusters', () => {
      const tasks = [
        // Cluster 1
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 90, end: 150 },
        // Cluster 2 (separate)
        { id: '3', title: 'Task 3', start: 200, end: 260 },
        { id: '4', title: 'Task 4', start: 230, end: 290 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(4);
      // Each cluster should have 2 lanes
      expect(result[0].clusterMaxLanes).toBe(2);
      expect(result[1].clusterMaxLanes).toBe(2);
      expect(result[2].clusterMaxLanes).toBe(2);
      expect(result[3].clusterMaxLanes).toBe(2);
      
      // Different cluster IDs
      expect(result[0].clusterId).not.toBe(result[2].clusterId);
    });

    it('should sort tasks by start time', () => {
      const tasks = [
        { id: '3', title: 'Task 3', start: 180, end: 240 },
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 120, end: 180 }
      ];
      const result = allocateLanes(tasks);
      
      // Should be sorted by start time
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('should handle tasks with same start time (sort by end)', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 180 },
        { id: '2', title: 'Task 2', start: 60, end: 120 }
      ];
      const result = allocateLanes(tasks);
      
      expect(result).toHaveLength(2);
      // Shorter task should be first
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });
  });

  describe('computeTaskLayout', () => {
    it('should compute correct vertical position and height', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120, lane: 0, clusterMaxLanes: 1 }
      ];
      const pxPerMinute = 1.8;
      const result = computeTaskLayout(tasks, 1440, 240, pxPerMinute, 4);
      
      expect(result[0].layout.topPx).toBe(60 * 1.8); // 108
      expect(result[0].layout.heightPx).toBe(60 * 1.8); // 108
    });

    it('should enforce minimum height of 44px', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 65, lane: 0, clusterMaxLanes: 1 } // 5 minutes
      ];
      const pxPerMinute = 1.8;
      const result = computeTaskLayout(tasks, 1440, 240, pxPerMinute, 4);
      
      expect(result[0].layout.heightPx).toBe(44); // Min height
    });

    it('should compute correct horizontal position for lanes', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120, lane: 0, clusterMaxLanes: 2 },
        { id: '2', title: 'Task 2', start: 90, end: 150, lane: 1, clusterMaxLanes: 2 }
      ];
      const containerWidth = 240;
      const gutterPx = 4;
      const result = computeTaskLayout(tasks, 1440, containerWidth, 1.8, gutterPx);
      
      const laneWidth = containerWidth / 2; // 120
      expect(result[0].layout.leftPx).toBe(0);
      expect(result[0].layout.widthPx).toBe(laneWidth - gutterPx); // 116
      expect(result[1].layout.leftPx).toBe(laneWidth); // 120
      expect(result[1].layout.widthPx).toBe(laneWidth - gutterPx); // 116
    });

    it('should enforce minimum width of 60px', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120, lane: 0, clusterMaxLanes: 10 }
      ];
      const containerWidth = 240;
      const result = computeTaskLayout(tasks, 1440, containerWidth, 1.8, 4);
      
      // Lane would be 240/10 - 4 = 20, but min is 60
      expect(result[0].layout.widthPx).toBe(60);
    });
  });

  describe('computeTaskLayoutWithLanes', () => {
    it('should combine lane allocation and layout computation', () => {
      const tasks = [
        { id: '1', title: 'Task 1', start: 60, end: 120 },
        { id: '2', title: 'Task 2', start: 90, end: 150 }
      ];
      const result = computeTaskLayoutWithLanes(tasks, 1440, 240, 1.8, 4);
      
      expect(result).toHaveLength(2);
      expect(result[0].lane).toBe(0);
      expect(result[1].lane).toBe(1);
      expect(result[0].layout).toBeDefined();
      expect(result[1].layout).toBeDefined();
    });

    it('should handle complex overlapping scenario', () => {
      const tasks = [
        { id: '1', title: 'Morning Meeting', start: 540, end: 600 }, // 9:00-10:00
        { id: '2', title: 'Stand-up', start: 550, end: 570 }, // 9:10-9:30
        { id: '3', title: 'Code Review', start: 560, end: 620 }, // 9:20-10:20
        { id: '4', title: 'Lunch', start: 720, end: 780 } // 12:00-13:00 (separate)
      ];
      const result = computeTaskLayoutWithLanes(tasks, 1440, 240, 1.8, 4);
      
      expect(result).toHaveLength(4);
      // First 3 tasks overlap
      expect(result[0].lane).toBe(0);
      expect(result[1].lane).toBe(1);
      expect(result[2].lane).toBe(2);
      expect(result[0].clusterMaxLanes).toBe(3);
      expect(result[1].clusterMaxLanes).toBe(3);
      expect(result[2].clusterMaxLanes).toBe(3);
      
      // Last task is separate
      expect(result[3].lane).toBe(0);
      expect(result[3].clusterMaxLanes).toBe(1);
    });
  });
});
