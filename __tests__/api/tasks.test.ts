// __tests__/api/tasks.test.ts

import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../../app/api/tasks/route';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe('Tasks API Route', () => {
  const mockFs = require('fs').promises;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return empty array when no tasks exist', async () => {
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });

      const request = new NextRequest('http://localhost/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toEqual([]);
    });

    it('should return only recurring tasks', async () => {
      const tasks = [
        {
          id: 1,
          title: 'Recurring Task',
          body: 'Body',
          isRecurring: true,
          recurrenceDays: 7,
          lastPingTimestamp: 1000,
          checkedUntil: 0,
        },
        {
          id: 2,
          title: 'One-time Task',
          body: 'Body',
          isRecurring: false,
          recurrenceDays: 0,
          lastPingTimestamp: 1000,
          checkedUntil: 0,
        },
      ];

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({ tasks }));

      const request = new NextRequest('http://localhost/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].isRecurring).toBe(true);
    });
  });

  describe('POST', () => {
    it('should sync recurring tasks to server', async () => {
      const tasks = [
        {
          id: 1,
          title: 'Recurring Task',
          body: 'Body',
          isRecurring: true,
          recurrenceDays: 7,
          lastPingTimestamp: 1000,
          checkedUntil: 0,
        },
      ];

      mockFs.writeFile.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ tasks }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should filter out non-recurring tasks', async () => {
      const tasks = [
        {
          id: 1,
          title: 'Recurring',
          isRecurring: true,
          recurrenceDays: 7,
          lastPingTimestamp: 1000,
          checkedUntil: 0,
        },
        {
          id: 2,
          title: 'One-time',
          isRecurring: false,
          recurrenceDays: 0,
          lastPingTimestamp: 1000,
          checkedUntil: 0,
        },
      ];

      mockFs.writeFile.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ tasks }),
      });

      await POST(request);

      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      expect(writtenData.tasks).toHaveLength(1);
      expect(writtenData.tasks[0].isRecurring).toBe(true);
    });

    it('should return error for invalid request', async () => {
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ tasks: 'invalid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must be an array');
    });
  });

  describe('PUT', () => {
    it('should update lastPingTimestamp for a task', async () => {
      const tasks = [
        {
          id: 1,
          title: 'Task',
          body: 'Body',
          isRecurring: true,
          recurrenceDays: 7,
          lastPingTimestamp: 1000,
          checkedUntil: 0,
        },
      ];

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({ tasks }));
      mockFs.writeFile.mockResolvedValue(undefined);

      const newTimestamp = Date.now();
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ taskId: 1, lastPingTimestamp: newTimestamp }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);
      expect(writtenData.tasks[0].lastPingTimestamp).toBe(newTimestamp);
    });

    it('should return error for missing parameters', async () => {
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ taskId: 1 }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });
});

