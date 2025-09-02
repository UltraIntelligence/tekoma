import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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

// Rate limiting storage (in-memory)
const rateLimitStore = new Map<string, { submissions: number; comments: number; resetTime: number }>();

// Security limits
const LIMITS = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_COMMENT_LENGTH: 300,
  MAX_NAME_LENGTH: 50,
  MAX_USER_TASKS: 100,
  MAX_COMMENTS_PER_TASK: 50,
  RATE_LIMIT_SUBMISSIONS: 5,  // per hour
  RATE_LIMIT_COMMENTS: 20,     // per hour
  RATE_LIMIT_WINDOW: 3600000   // 1 hour in ms
};

// Get client IP address
function getClientIp(): string {
  const hdrs = headers();
  const forwardedFor = hdrs.get('x-forwarded-for');
  const realIp = hdrs.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

// Check rate limit
function checkRateLimit(ip: string, type: 'submission' | 'comment'): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);
  
  // Clean up old entries
  if (limit && now > limit.resetTime) {
    rateLimitStore.delete(ip);
  }
  
  const currentLimit = rateLimitStore.get(ip) || {
    submissions: 0,
    comments: 0,
    resetTime: now + LIMITS.RATE_LIMIT_WINDOW
  };
  
  if (type === 'submission') {
    if (currentLimit.submissions >= LIMITS.RATE_LIMIT_SUBMISSIONS) {
      return false;
    }
    currentLimit.submissions++;
  } else {
    if (currentLimit.comments >= LIMITS.RATE_LIMIT_COMMENTS) {
      return false;
    }
    currentLimit.comments++;
  }
  
  rateLimitStore.set(ip, currentLimit);
  return true;
}

// Validate and sanitize input
function validateInput(data: any): { valid: boolean; error?: string } {
  // Check honeypot
  if (data.website) {
    return { valid: false, error: 'Bot detected' };
  }
  
  // Validate user tasks
  if (data.userTasks) {
    // Check total task limit
    if (data.userTasks.length > LIMITS.MAX_USER_TASKS) {
      return { valid: false, error: 'Maximum task limit reached (100 tasks)' };
    }
    
    // Validate each task
    for (const task of data.userTasks) {
      if (task.title && task.title.length > LIMITS.MAX_TITLE_LENGTH) {
        return { valid: false, error: `Task title too long (max ${LIMITS.MAX_TITLE_LENGTH} characters)` };
      }
      if (task.description && task.description.length > LIMITS.MAX_DESCRIPTION_LENGTH) {
        return { valid: false, error: `Description too long (max ${LIMITS.MAX_DESCRIPTION_LENGTH} characters)` };
      }
      if (task.author && task.author.length > LIMITS.MAX_NAME_LENGTH) {
        return { valid: false, error: `Name too long (max ${LIMITS.MAX_NAME_LENGTH} characters)` };
      }
    }
  }
  
  // Validate comments
  if (data.comments) {
    for (const taskId in data.comments) {
      const taskComments = data.comments[taskId];
      
      // Check comment limit per task
      if (taskComments.length > LIMITS.MAX_COMMENTS_PER_TASK) {
        return { valid: false, error: `Too many comments on task (max ${LIMITS.MAX_COMMENTS_PER_TASK})` };
      }
      
      // Validate each comment
      for (const comment of taskComments) {
        if (comment.text && comment.text.length > LIMITS.MAX_COMMENT_LENGTH) {
          return { valid: false, error: `Comment too long (max ${LIMITS.MAX_COMMENT_LENGTH} characters)` };
        }
        if (comment.author && comment.author.length > LIMITS.MAX_NAME_LENGTH) {
          return { valid: false, error: `Name too long (max ${LIMITS.MAX_NAME_LENGTH} characters)` };
        }
      }
    }
  }
  
  return { valid: true };
}

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
    const data = await request.json();
    const { tasks, comments, userTasks } = data;
    
    // Get client IP for rate limiting
    const clientIp = getClientIp();
    
    // Determine if this is a new submission or comment
    let isNewSubmission = false;
    let isNewComment = false;
    
    // Get current data to check for new items
    let currentData: any = {};
    if (redis) {
      currentData.userTasks = await redis.get('userTasks') || [];
      currentData.comments = await redis.get('comments') || {};
    } else if (kv) {
      currentData.userTasks = await kv.get('userTasks') || [];
      currentData.comments = await kv.get('comments') || {};
    } else {
      currentData = inMemoryStore;
    }
    
    // Check if new user task
    if (userTasks && userTasks.length > currentData.userTasks.length) {
      isNewSubmission = true;
      if (!checkRateLimit(clientIp, 'submission')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before submitting again.' },
          { status: 429 }
        );
      }
    }
    
    // Check if new comment
    if (comments) {
      for (const taskId in comments) {
        const newComments = comments[taskId] || [];
        const oldComments = currentData.comments[taskId] || [];
        if (newComments.length > oldComments.length) {
          isNewComment = true;
          if (!checkRateLimit(clientIp, 'comment')) {
            return NextResponse.json(
              { error: 'Rate limit exceeded. Please wait before commenting again.' },
              { status: 429 }
            );
          }
          break;
        }
      }
    }
    
    // Validate input
    const validation = validateInput(data);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
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