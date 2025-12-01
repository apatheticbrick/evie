// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Use /tmp for Vercel compatibility (writable directory)
const TASKS_FILE = path.join('/tmp', 'tasks.json');

interface Task {
  id: number;
  title: string;
  body: string;
  isRecurring: boolean;
  recurrenceDays: number;
  lastPingTimestamp: number;
}

// Helper function to read tasks from file
function readTasksFromFile(): Task[] {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const data = fs.readFileSync(TASKS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.tasks || [];
    }
  } catch (error) {
    console.error('Error reading tasks file:', error);
  }
  return [];
}

// Helper function to write tasks to file
function writeTasksToFile(tasks: Task[]): void {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing tasks file:', error);
  }
}

// GET: Retrieve all recurring tasks
export async function GET(request: NextRequest) {
  try {
    const tasks = readTasksFromFile();
    const recurringTasks = tasks.filter(task => task.isRecurring);
    return NextResponse.json({ tasks: recurringTasks }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Sync tasks from client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid request: tasks must be an array' }, { status: 400 });
    }

    // Filter to only store recurring tasks on the server
    const recurringTasks = tasks.filter((task: Task) => task.isRecurring);
    writeTasksToFile(recurringTasks);

    return NextResponse.json({ ok: true, message: 'Tasks synced successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error syncing tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a specific task's lastPingTimestamp
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, lastPingTimestamp } = body;

    if (!taskId || !lastPingTimestamp) {
      return NextResponse.json({ error: 'Invalid request: taskId and lastPingTimestamp required' }, { status: 400 });
    }

    const tasks = readTasksFromFile();
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, lastPingTimestamp } 
        : task
    );
    writeTasksToFile(updatedTasks);

    return NextResponse.json({ ok: true, message: 'Task updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

