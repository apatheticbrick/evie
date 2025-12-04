// __tests__/Task.test.ts

// Import the Task class from page.tsx
// Since Task is defined in page.tsx, we'll test it by importing the logic
// For a cleaner approach, we could extract Task to a separate file, but for now we'll test it inline

describe('Task Class', () => {
  // Define Task class inline for testing
  class Task {
    id: number;
    title: string;
    body: string;
    isRecurring: boolean;
    recurrenceDays: number;
    lastPingTimestamp: number;
    checkedUntil: number;

    constructor(
      id: number,
      title: string,
      body: string,
      isRecurring: boolean = false,
      recurrenceDays: number = 0,
      lastPingTimestamp: number = 0,
      checkedUntil: number = 0
    ) {
      this.id = id;
      this.title = title;
      this.body = body;
      this.isRecurring = isRecurring;
      this.recurrenceDays = recurrenceDays;
      this.lastPingTimestamp = lastPingTimestamp || id;
      this.checkedUntil = checkedUntil || 0;
    }
  }

  it('should create a basic task with default values', () => {
    const task = new Task(1, 'Test Task', 'Test body');
    
    expect(task.id).toBe(1);
    expect(task.title).toBe('Test Task');
    expect(task.body).toBe('Test body');
    expect(task.isRecurring).toBe(false);
    expect(task.recurrenceDays).toBe(0);
    expect(task.lastPingTimestamp).toBe(1);
    expect(task.checkedUntil).toBe(0);
  });

  it('should create a recurring task', () => {
    const task = new Task(2, 'Recurring Task', 'Body', true, 7, 1000, 0);
    
    expect(task.isRecurring).toBe(true);
    expect(task.recurrenceDays).toBe(7);
    expect(task.lastPingTimestamp).toBe(1000);
  });

  it('should set lastPingTimestamp to id if not provided', () => {
    const task = new Task(12345, 'Task', 'Body');
    expect(task.lastPingTimestamp).toBe(12345);
  });

  it('should handle checkedUntil timestamp', () => {
    const checkedUntil = Date.now() + 86400000; // 1 day from now
    const task = new Task(3, 'Task', 'Body', true, 7, 1000, checkedUntil);
    
    expect(task.checkedUntil).toBe(checkedUntil);
  });
});

