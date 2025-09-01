import { NextResponse } from 'next/server';

// For Upstash Redis (if available)
let redis: any = null;

// For Vercel KV (if available)  
let kv: any = null;

// Initialize Redis client if environment variables are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else if (process.env.KV_URL) {
  // Try Vercel KV if available
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
}

// Fallback in-memory storage for local development
let inMemoryStore: any = {
  tasks: {},
  comments: {},
  userTasks: []
};

export async function GET() {
  try {
    // Try to use Upstash Redis if available
    if (redis) {
      const tasks = await redis.get('tasks') || {};
      const comments = await redis.get('comments') || {};
      const userTasks = await redis.get('userTasks') || [];
      
      return NextResponse.json({ tasks, comments, userTasks });
    } else if (kv) {
      // Try to use Vercel KV if available
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
    // If there's an error with KV/Redis, fallback to in-memory storage
    return NextResponse.json(inMemoryStore);
  }
}

export async function POST(request: Request) {
  try {
    const { tasks, comments, userTasks } = await request.json();
    
    // Try to use Upstash Redis if available
    if (redis) {
      if (tasks !== undefined) await redis.set('tasks', tasks);
      if (comments !== undefined) await redis.set('comments', comments);
      if (userTasks !== undefined) await redis.set('userTasks', userTasks);
    } else if (kv) {
      // Try to use Vercel KV if available
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