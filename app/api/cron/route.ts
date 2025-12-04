// app/api/cron/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { REST } from '@discordjs/rest';
import { promises as fs } from 'fs';
import path from 'path';

// Use /tmp for Vercel compatibility (writable directory)
const TASKS_FILE = path.join('/tmp', 'tasks.json');

interface RecurringTask {
  id: number;
  title: string;
  body: string;
  isRecurring: boolean;
  recurrenceDays: number;
  lastPingTimestamp: number;
  checkedUntil: number;
}

// Helper function to read tasks from file
async function readTasksFromFile(): Promise<RecurringTask[]> {
  try {
    await fs.access(TASKS_FILE);
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.tasks || [];
  } catch (error) {
    // File doesn't exist or can't be read - return empty array
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[Cron] Error reading tasks file:', error);
    }
    return [];
  }
}

// Helper function to write tasks to file
async function writeTasksToFile(tasks: RecurringTask[]): Promise<void> {
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks }, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Cron] Error writing tasks file:', error);
  }
}

async function getRecurringTasksFromDB(): Promise<RecurringTask[]> {
    const allTasks = await readTasksFromFile();
    return allTasks.filter(task => task.isRecurring);
}

async function updateLastPingTimestamp(taskId: number, newTimestamp: number) {
    const tasks = await readTasksFromFile();
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, lastPingTimestamp: newTimestamp } 
        : task
    );
    await writeTasksToFile(updatedTasks);
    console.log(`[Cron] Updated task ${taskId} lastPingTimestamp to ${newTimestamp}`);
}

// Utility function to send the Discord message (reusing logic from your existing route.ts)
async function sendDiscordMessage(message: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.CHANNEL;

  if (!token || !channelId) {
    console.error('Server is missing Discord configuration.');
    return false;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.post(`/channels/${channelId}/messages`, {
      body: { content: message },
    } as any);
    return true;
  } catch (error) {
    console.error('Failed to send Discord message:', error);
    return false;
  }
}


export async function GET(request: NextRequest) {
  // Optional: Add a security check here to ensure the request is from your scheduler
  // e.g., checking a secret header or IP address, as described in the Vercel docs

  try {
    const recurringTasks = await getRecurringTasksFromDB();
    const now = Date.now();
    const tasksDueForPing: RecurringTask[] = [];

    for (const task of recurringTasks) {
      // Reset checkedUntil if the interval has passed
      if (task.checkedUntil > 0 && now >= task.checkedUntil) {
        task.checkedUntil = 0;
        // Update the task in storage
        const tasks = await readTasksFromFile();
        const updatedTasks = tasks.map(t => 
          t.id === task.id ? { ...t, checkedUntil: 0 } : t
        );
        await writeTasksToFile(updatedTasks);
      }

      // Convert recurrenceDays to milliseconds
      const recurrenceMs = task.recurrenceDays * 24 * 60 * 60 * 1000;
      const nextPingDue = task.lastPingTimestamp + recurrenceMs;

      // Check if the current time is past the next due time and task is not checked off
      if (now >= nextPingDue && (task.checkedUntil === 0 || now >= task.checkedUntil)) {
        tasksDueForPing.push(task);
      }
    }

    if (tasksDueForPing.length === 0) {
        console.log('[Cron] No recurring tasks are due for a ping.');
        return NextResponse.json({ ok: true, message: 'No tasks due.' }, { status: 200 });
    }

    // Ping Discord for each due task
    for (const task of tasksDueForPing) {
      const discordMessage = `🔔 **RECURRING TASK DUE** 🔔\n\nTask: ${task.title}\nRecurrence: Every ${task.recurrenceDays} days.`;
      const success = await sendDiscordMessage(discordMessage);

      if (success) {
        // Update the last ping timestamp in the database after a successful ping
        await updateLastPingTimestamp(task.id, now);
      }
    }

    return NextResponse.json({ ok: true, pingsSent: tasksDueForPing.length }, { status: 200 });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}