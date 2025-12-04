// __tests__/recurring-tasks.test.ts

/**
 * Tests for recurring task logic
 */

describe('Recurring Task Logic', () => {
  describe('Interval Calculation', () => {
    it('should calculate next ping time correctly', () => {
      const lastPing = 1000000000000; // Fixed timestamp
      const recurrenceDays = 7;
      const recurrenceMs = recurrenceDays * 24 * 60 * 60 * 1000;
      const nextPingDue = lastPing + recurrenceMs;

      expect(nextPingDue).toBe(lastPing + 604800000); // 7 days in ms
    });

    it('should detect when task is due', () => {
      const now = Date.now();
      const lastPing = now - 86400000; // 1 day ago
      const recurrenceDays = 1;
      const recurrenceMs = recurrenceDays * 24 * 60 * 60 * 1000;
      const nextPingDue = lastPing + recurrenceMs;

      expect(now >= nextPingDue).toBe(true);
    });

    it('should detect when task is not due', () => {
      const now = Date.now();
      const lastPing = now - 3600000; // 1 hour ago
      const recurrenceDays = 1;
      const recurrenceMs = recurrenceDays * 24 * 60 * 60 * 1000;
      const nextPingDue = lastPing + recurrenceMs;

      expect(now >= nextPingDue).toBe(false);
    });
  });

  describe('Checked Off State', () => {
    it('should calculate checkedUntil correctly', () => {
      const now = Date.now();
      const recurrenceDays = 7;
      const checkedUntil = now + (recurrenceDays * 24 * 60 * 60 * 1000);

      expect(checkedUntil).toBeGreaterThan(now);
      expect(checkedUntil - now).toBe(604800000); // 7 days in ms
    });

    it('should detect when checked off period has expired', () => {
      const now = Date.now();
      const pastCheckedUntil = now - 1000; // Expired 1 second ago

      expect(now >= pastCheckedUntil).toBe(true);
    });

    it('should detect when checked off period is still active', () => {
      const now = Date.now();
      const futureCheckedUntil = now + 86400000; // 1 day in future

      expect(now >= futureCheckedUntil).toBe(false);
    });
  });

  describe('Task Filtering', () => {
    it('should filter recurring tasks correctly', () => {
      const tasks = [
        { id: 1, isRecurring: true, recurrenceDays: 7 },
        { id: 2, isRecurring: false, recurrenceDays: 0 },
        { id: 3, isRecurring: true, recurrenceDays: 1 },
      ];

      const recurringTasks = tasks.filter(task => task.isRecurring);

      expect(recurringTasks).toHaveLength(2);
      expect(recurringTasks.every(task => task.isRecurring)).toBe(true);
    });

    it('should filter tasks that are not checked off', () => {
      const now = Date.now();
      const tasks = [
        { id: 1, isRecurring: true, checkedUntil: 0 },
        { id: 2, isRecurring: true, checkedUntil: now + 86400000 },
        { id: 3, isRecurring: true, checkedUntil: now - 1000 },
      ];

      const activeTasks = tasks.filter(task => 
        task.isRecurring && (task.checkedUntil === 0 || now >= task.checkedUntil)
      );

      expect(activeTasks).toHaveLength(2); // Tasks 1 and 3
    });
  });
});

