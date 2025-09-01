# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tekoma Energy Website Refresh Project Tracker - A Next.js 15 application for managing and tracking website improvement tasks with real-time collaboration features.

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
```

## Architecture

### Application Structure
- **Main Entry**: `app/page.tsx` imports `ProjectTracker` component
- **Core Logic**: `app/ProjectTracker.tsx` contains all business logic and state management
- **Data Sources**: 
  - `lib/data-detailed.ts` - Complete task data with Wix implementation steps
  - `lib/data.ts` - Simplified public-facing task data
- **API**: `/api/data` handles GET/POST for data persistence

### URL Modes
- **Public View**: `https://tekoma.vercel.app` - Shows basic task information
- **Internal View**: `https://tekoma.vercel.app?mode=internal` - Shows Wix execution steps, time estimates, and detailed implementation instructions

### Data Storage Strategy (Multi-tier)
1. **Production**: Vercel KV (Redis) - Auto-configured on Vercel
2. **Alternative**: Upstash Redis - Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. **Development**: In-memory storage - Automatic fallback

### Key Features
- **Real-time Updates**: Polling every 30 seconds for new tasks
- **Notification System**: Badge counts for unseen user submissions in Phase 7
- **Comment System**: Per-task notes with delete functionality
- **Progress Tracking**: Visual progress bars and task completion statistics
- **User Submissions**: Form in Phase 7 for requesting new tasks

## Data Model

```typescript
interface AppState {
  tasks: Record<string, boolean>;        // Task completion status
  comments: Record<string, Comment[]>;   // Task comments with timestamps
  userTasks: Task[];                     // User-submitted task requests
}

interface Task {
  id: string;
  code?: string;        // Task category (G-FIX, R-NEW, etc.)
  title: string;
  time?: number;        // Hours estimate (internal mode only)
  source?: string;      // Request source
  justification?: string;
  wixSteps?: string[];  // Wix CMS steps (internal mode only)
  author?: string;      // For user submissions
  description?: string; // For user submissions
  timestamp?: number;   // For tracking new submissions
}
```

## Task Categories
- **G-FIX**: General fixes (navigation, locations, content corrections)
- **R-NEW**: Ricardo-led new features and major updates
- **R-SWITCH**: Ricardo-led content switches and updates
- **RICARDO-NEW**: Ricardo-specific implementations
- **G-SWITCH**: General content updates and compliance changes

## Project Phases
1. **Phase 1**: Complete Tech & Data Setup
2. **Phase 2**: Structure & Information Architecture
3. **Phase 3**: Core Content Development
4. **Phase 4**: Japanese Market Adaptation
5. **Phase 5**: Enhanced Features & Portfolio Integration
6. **Phase 6**: SEO & Performance Optimization
7. **Phase 7**: User Submissions (dynamic)

## Important Implementation Details

### Notification System
- Uses localStorage to track seen task IDs
- Badge appears on Phase 7 when new tasks are submitted
- Automatically clears when Phase 7 is expanded
- Visual "NEW" indicators on unseen tasks

### Comment Deletion
- Hover to reveal delete button (×)
- Immediately updates both UI and backend
- Preserves comment order after deletion

### User Task Display
- User-submitted tasks in Phase 7 use same layout as regular tasks
- Includes checkbox, comments, and full task structure
- Labeled with "USER-REQ" code
- Shows requester name and submission date in source field

## Deployment Notes

The application auto-deploys to Vercel on push to main branch. Vercel KV database is automatically configured for production persistence.

## Business Context

This tracker manages 70+ website improvement tasks for Tekoma Energy's corporate website refresh, with specific focus on:
- HSBC Asset Management partnership compliance
- Japanese market adaptations and location corrections
- Bilingual content management
- Corporate governance and sustainability reporting