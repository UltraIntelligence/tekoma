# Tekoma Energy Project Tracker

A simple web app for tracking project tasks with persistent shared storage using Vercel KV.

## Features

- Track project tasks across multiple phases
- Add comments to tasks
- Submit new task requests
- Persistent storage using Vercel KV (Redis)
- Works locally with in-memory storage

## Deployment

1. Push this code to a GitHub repository

2. Go to [Vercel](https://vercel.com) and import the project

3. During deployment, set the project name to ensure it deploys to `tekoma.vercel.app`

4. After deployment, set up Vercel KV:
   - Go to your project dashboard on Vercel
   - Navigate to the "Storage" tab
   - Click "Create Database" and select "KV"
   - Connect it to your project
   - The environment variables will be automatically added

## Local Development

```bash
npm install
npm run dev
```

The app will run at http://localhost:3000 with in-memory storage.

## Environment Variables

When deployed to Vercel with KV storage, these will be automatically set:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## How It Works

- The app uses Vercel KV (Redis) for persistent storage when deployed
- Falls back to in-memory storage for local development
- All users share the same data store
- Data persists across deployments