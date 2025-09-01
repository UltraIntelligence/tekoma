import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// For development, we'll use in-memory storage if KV is not available
let inMemoryStore: any = {
  tasks: {},
  comments: {},
  userTasks: []
};

export async function GET() {
  try {
    // Try to use Vercel KV if available
    if (process.env.KV_URL) {
      const tasks = await kv.get('tasks') || {};
      const comments = await kv.get('comments') || {};
      const userTasks = await kv.get('userTasks') || [];
      
      return NextResponse.json({ tasks, comments, userTasks });
    } else {
      // Fallback to in-memory storage for local development
      return NextResponse.json(inMemoryStore);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return in-memory store on error
    return NextResponse.json(inMemoryStore);
  }
}

export async function POST(request: Request) {
  try {
    const { tasks, comments, userTasks } = await request.json();
    
    // Try to use Vercel KV if available
    if (process.env.KV_URL) {
      if (tasks !== undefined) await kv.set('tasks', tasks);
      if (comments !== undefined) await kv.set('comments', comments);
      if (userTasks !== undefined) await kv.set('userTasks', userTasks);
    } else {
      // Fallback to in-memory storage for local development
      if (tasks !== undefined) inMemoryStore.tasks = tasks;
      if (comments !== undefined) inMemoryStore.comments = comments;
      if (userTasks !== undefined) inMemoryStore.userTasks = userTasks;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}