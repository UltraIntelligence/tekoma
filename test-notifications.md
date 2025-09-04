# Testing the Notification System

## How to Test

1. **Access the internal view**: Go to http://localhost:3001?mode=internal

2. **First Time Setup**: 
   - You'll be prompted to enter your name (e.g., "Ryan")
   - This will be stored for tracking your updates

3. **Testing Notifications**:
   - Open the site in two different browsers or incognito windows
   - In each window, go to the internal view and use different names (e.g., "Ryan" and "Sarah")
   
4. **Create Activity**:
   - In Sarah's window: Complete a task, add a comment, or submit a new task
   - In Ryan's window: Click refresh or wait for the auto-check (every 30 seconds)
   
5. **View Notifications**:
   - Ryan should see a yellow notification bar showing "Sarah completed/commented on..."
   - Click the notification to see detailed activity panel
   - Each activity shows:
     - Who made the update
     - What they did (completed task, added comment, etc.)
     - Which task and phase were affected
     - Timestamp of the change
   
6. **Dismiss Notifications**:
   - Click the × on individual notifications to dismiss them permanently
   - Click "Clear All" to dismiss all notifications at once
   - Dismissed notifications won't appear again (stored in localStorage)
   
7. **Your Own Actions**:
   - Your own actions (tasks you complete, comments you add) won't show as notifications
   - Only other users' activities appear in your notification panel

## Key Features

- **Internal View Only**: Notifications only work in internal mode (?mode=internal)
- **User Tracking**: Each update is tagged with who made it
- **Persistent Dismissal**: Once dismissed, notifications don't reappear
- **Activity Types Tracked**:
  - Task completions/uncompletion
  - Comments added
  - User task submissions
- **24-hour Window**: Only shows activities from the last 24 hours
- **Auto-refresh**: Checks for new activities every 30 seconds

## Testing Checklist

- [ ] Name prompt appears on first visit to internal view
- [ ] Other users' task completions show as notifications
- [ ] Other users' comments show as notifications
- [ ] Your own actions don't appear as notifications
- [ ] Clicking notification opens detailed panel
- [ ] Individual notifications can be dismissed
- [ ] "Clear All" removes all notifications
- [ ] Dismissed notifications don't reappear after refresh
- [ ] Activity shows correct user name, task, and phase
- [ ] Orange dot appears on phases with new activity