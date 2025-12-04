// __tests__/api/cron.test.ts

import { NextRequest } from 'next/server';
import { GET } from '../../app/api/cron/route';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Mock @discordjs/rest
jest.mock('@discordjs/rest', () => ({
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    post: jest.fn(),
  })),
}));

describe('Cron API Route', () => {
  const mockFs = require('fs').promises;
  const { REST } = require('@discordjs/rest');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_BOT_TOKEN = 'test-token';
    process.env.CHANNEL = 'test-channel';
  });

  afterEach(() => {
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.CHANNEL;
  });

  it('should return no tasks when no recurring tasks exist', async () => {
    mockFs.access.mockRejectedValue({ code: 'ENOENT' });

    const request = new NextRequest('http://localhost/api/cron');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('No tasks due.');
  });

  it('should handle tasks that are not due yet', async () => {
    const now = Date.now();
    const futureTimestamp = now + 86400000; // 1 day in future
    
    const tasks = [
      {
        id: 1,
        title: 'Test Task',
        body: 'Body',
        isRecurring: true,
        recurrenceDays: 7,
        lastPingTimestamp: futureTimestamp,
        checkedUntil: 0,
      },
    ];

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ tasks }));

    const request = new NextRequest('http://localhost/api/cron');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('No tasks due.');
  });

  it('should send Discord message for due recurring tasks', async () => {
    const now = Date.now();
    const pastTimestamp = now - 86400000; // 1 day ago
    
    const tasks = [
      {
        id: 1,
        title: 'Test Task',
        body: 'Body',
        isRecurring: true,
        recurrenceDays: 1, // Daily task
        lastPingTimestamp: pastTimestamp,
        checkedUntil: 0,
      },
    ];

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ tasks }));
    
    const mockPost = jest.fn().mockResolvedValue({});
    REST.mockImplementation(() => ({
      setToken: jest.fn().mockReturnThis(),
      post: mockPost,
    }));

    const request = new NextRequest('http://localhost/api/cron');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pingsSent).toBe(1);
    expect(mockPost).toHaveBeenCalled();
  });

  it('should not ping tasks that are checked off', async () => {
    const now = Date.now();
    const pastTimestamp = now - 86400000;
    const futureCheckedUntil = now + 86400000; // Still checked off
    
    const tasks = [
      {
        id: 1,
        title: 'Test Task',
        body: 'Body',
        isRecurring: true,
        recurrenceDays: 1,
        lastPingTimestamp: pastTimestamp,
        checkedUntil: futureCheckedUntil,
      },
    ];

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ tasks }));

    const request = new NextRequest('http://localhost/api/cron');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('No tasks due.');
  });

  it('should reset checkedUntil when interval expires', async () => {
    const now = Date.now();
    const pastCheckedUntil = now - 1000; // Expired
    
    const tasks = [
      {
        id: 1,
        title: 'Test Task',
        body: 'Body',
        isRecurring: true,
        recurrenceDays: 1,
        lastPingTimestamp: now - 86400000,
        checkedUntil: pastCheckedUntil,
      },
    ];

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ tasks }));
    mockFs.writeFile.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/cron');
    await GET(request);

    expect(mockFs.writeFile).toHaveBeenCalled();
    const writeCall = mockFs.writeFile.mock.calls[0];
    const writtenData = JSON.parse(writeCall[1]);
    expect(writtenData.tasks[0].checkedUntil).toBe(0);
  });
});

