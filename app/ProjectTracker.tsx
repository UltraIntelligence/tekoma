'use client';

import { useState, useEffect, Suspense } from 'react';
import { projectDataDetailed } from '@/lib/data-detailed';
import { useSearchParams } from 'next/navigation';
import TekomaLogo from '@/components/TekomaLogo';

interface Task {
  id: string;
  code?: string;
  title: string;
  time?: number;
  source?: string;
  justification?: string;
  author?: string;
  description?: string;
  timestamp?: number;
  wixSteps?: string[];
  action?: string;
}

interface Phase {
  id: string;
  title: string;
  tasks: Task[];
  isUserSubmitted?: boolean;
}

interface Comment {
  author: string;
  text: string;
  timestamp: number;
}

interface AppState {
  tasks: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  userTasks: Task[];
  taskUpdates?: Record<string, { completed: boolean; updatedBy: string; timestamp: number }>;
  activityLog?: ActivityEntry[];
}

interface ActivityEntry {
  id: string;
  type: 'task_completed' | 'task_uncompleted' | 'comment_added' | 'comment_deleted' | 'user_task_submitted';
  taskId: string;
  taskTitle: string;
  phaseId: string;
  phaseTitle: string;
  updatedBy: string;
  timestamp: number;
  details?: string;
}

function ProjectTrackerContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isInternal = mode === 'internal';
  // Always use detailed data for better information
  const data = projectDataDetailed;
  
  const [appState, setAppState] = useState<AppState>({
    tasks: {},
    comments: {},
    userTasks: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [seenTaskIds, setSeenTaskIds] = useState<Set<string>>(new Set());
  const [newTaskCount, setNewTaskCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [phaseActivity, setPhaseActivity] = useState<Record<string, boolean>>({});
  const [activitySummary, setActivitySummary] = useState<string>('');
  const [lastKnownState, setLastKnownState] = useState<{ comments: number; completed: number }>({ comments: 0, completed: 0 });
  const [currentUser, setCurrentUser] = useState<string>('');
  const [dismissedActivityIds, setDismissedActivityIds] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  // Load data from API
  useEffect(() => {
    // Load seen tasks from localStorage
    const storedSeenTasks = localStorage.getItem('seenTaskIds');
    if (storedSeenTasks) {
      setSeenTaskIds(new Set(JSON.parse(storedSeenTasks)));
    }
    
    // For internal view, load user and dismissed activities
    if (isInternal) {
      // Load or set current user
      const storedUser = localStorage.getItem('tekoma_current_user');
      if (!storedUser) {
        const userName = prompt('Please enter your name for tracking updates:') || 'Anonymous';
        localStorage.setItem('tekoma_current_user', userName);
        setCurrentUser(userName);
      } else {
        setCurrentUser(storedUser);
      }
      
      // Load dismissed activity IDs
      const dismissed = localStorage.getItem('tekoma_dismissed_activities');
      if (dismissed) {
        setDismissedActivityIds(new Set(JSON.parse(dismissed)));
      }
    }
    
    // Load initial data
    loadData();
    
    // Activity checking for internal view only
    if (isInternal) {
      const interval = setInterval(async () => {
        checkForActivity();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isInternal]);
  
  // Update new task count when data changes
  useEffect(() => {
    const unseenTasks = appState.userTasks.filter(task => !seenTaskIds.has(task.id));
    setNewTaskCount(unseenTasks.length);
  }, [appState.userTasks, seenTaskIds]);

  // Check for new activity without updating the UI
  const checkForActivity = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
      // Get activity log and filter out current user's actions and dismissed items
      const newActivities: ActivityEntry[] = [];
      if (data.activityLog) {
        const relevantActivities = data.activityLog.filter((activity: ActivityEntry) => {
          // Filter out current user's actions
          if (activity.updatedBy === currentUser) return false;
          // Filter out dismissed activities
          if (dismissedActivityIds.has(activity.id)) return false;
          // Only show recent activities (last 24 hours)
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          return activity.timestamp > dayAgo;
        });
        
        newActivities.push(...relevantActivities);
      }
      
      // Set activity indicators if there are new activities
      if (newActivities.length > 0) {
        setRecentActivities(newActivities);
        setHasNewActivity(true);
        
        // Build summary
        const summary = newActivities.slice(0, 3).map(a => {
          switch (a.type) {
            case 'task_completed':
              return `${a.updatedBy} completed "${a.taskTitle}"`;
            case 'comment_added':
              return `${a.updatedBy} commented on "${a.taskTitle}"`;
            case 'user_task_submitted':
              return `${a.updatedBy} submitted "${a.taskTitle}"`;
            default:
              return `${a.updatedBy} updated "${a.taskTitle}"`;
          }
        }).join('; ');
        
        setActivitySummary(summary + (newActivities.length > 3 ? ` and ${newActivities.length - 3} more...` : ''));
        
        // Mark phases with activity
        const phaseMap: Record<string, boolean> = {};
        newActivities.forEach(activity => {
          phaseMap[activity.phaseId] = true;
        });
        setPhaseActivity(phaseMap);
      } else {
        setHasNewActivity(false);
        setRecentActivities([]);
        setActivitySummary('');
        setPhaseActivity({});
      }
    } catch (error) {
      console.error('Error checking for activity:', error);
    }
  };
  
  const loadData = async (isPolling = false) => {
    try {
      const response = await fetch('/api/data?t=' + Date.now(), {
        cache: 'no-store', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('Loaded data from server:', { 
        comments: data.comments,
        commentCount: Object.values(data.comments || {}).reduce((sum: number, c: any) => sum + c.length, 0),
        tasks: data.tasks,
        userTasks: data.userTasks,
        taskCount: data.userTasks?.length || 0 
      });
      
      // Check for new tasks since last check
      if (isPolling && data.userTasks) {
        const newTasks = data.userTasks.filter((task: Task) => 
          task.timestamp && task.timestamp > lastCheckTime
        );
        
        if (newTasks.length > 0) {
          // Flash a subtle animation on Phase 7 header
          const phase7Element = document.getElementById('phase7');
          if (phase7Element) {
            phase7Element.classList.add('new-activity');
            setTimeout(() => {
              phase7Element.classList.remove('new-activity');
            }, 3000);
          }
        }
      }
      
      // Force update the state with server data
      setAppState({
        tasks: data.tasks || {},
        comments: data.comments || {},
        userTasks: data.userTasks || []
      });
      
      console.log('Updated app state with server data');
      
      if (!isPolling) {
        setLastCheckTime(Date.now());
        
        // Log activity before clearing if there was any
        if (hasNewActivity && activitySummary) {
          console.log('Activity detected before refresh:', activitySummary);
        }
        
        // Reset activity indicators after refresh
        setHasNewActivity(false);
        setPhaseActivity({});
        setActivitySummary('');
        
        // Update last known state for activity detection
        let totalComments = 0;
        let totalCompleted = 0;
        Object.values(data.comments || {}).forEach((comments: any) => {
          totalComments += comments.length;
        });
        Object.values(data.tasks || {}).forEach((completed: any) => {
          if (completed) totalCompleted++;
        });
        setLastKnownState({ comments: totalComments, completed: totalCompleted });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newState: Partial<AppState>) => {
    const updatedState = { ...appState, ...newState };
    console.log('Saving data to server:', updatedState);
    setAppState(updatedState);
    
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Server error:', error);
        alert(error.error || 'Failed to save data');
        // Reload data from server to sync state
        await loadData();
      } else {
        console.log('Data saved successfully');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
    
    // Mark all user tasks as seen when opening Phase 7
    if (phaseId === 'phase7' && !expandedPhases[phaseId]) {
      const newSeenIds = new Set(seenTaskIds);
      appState.userTasks.forEach(task => {
        newSeenIds.add(task.id);
      });
      setSeenTaskIds(newSeenIds);
      localStorage.setItem('seenTaskIds', JSON.stringify(Array.from(newSeenIds)));
    }
  };

  const toggleTask = (taskId: string) => {
    const isCompleted = !appState.tasks[taskId];
    const newTasks = { ...appState.tasks, [taskId]: isCompleted };
    
    // For internal view, track who made the change
    let updates = {};
    if (isInternal && currentUser) {
      // Find task details for activity log
      let taskTitle = '';
      let phaseId = '';
      let phaseTitle = '';
      
      for (const phase of data.phases) {
        const task = phase.tasks.find(t => t.id === taskId);
        if (task) {
          taskTitle = task.title;
          phaseId = phase.id;
          phaseTitle = phase.title;
          break;
        }
      }
      
      // Create activity entry
      const activityEntry: ActivityEntry = {
        id: `activity-${Date.now()}-${Math.random()}`,
        type: isCompleted ? 'task_completed' : 'task_uncompleted',
        taskId,
        taskTitle,
        phaseId,
        phaseTitle,
        updatedBy: currentUser,
        timestamp: Date.now()
      };
      
      const currentLog = appState.activityLog || [];
      updates = {
        tasks: newTasks,
        taskUpdates: {
          ...appState.taskUpdates,
          [taskId]: { completed: isCompleted, updatedBy: currentUser, timestamp: Date.now() }
        },
        activityLog: [...currentLog, activityEntry]
      };
    } else {
      updates = { tasks: newTasks };
    }
    
    saveData(updates);
  };

  const addComment = (taskId: string, author: string, text: string) => {
    if (!author.trim() || !text.trim()) {
      alert('Please enter both your name and a comment.');
      return;
    }
    
    // Client-side length validation
    if (author.length > 50) {
      alert('Name is too long (maximum 50 characters)');
      return;
    }
    
    if (text.length > 1000) {
      alert('Comment is too long (maximum 1000 characters)');
      return;
    }
    
    // Check comment limit
    const existingComments = appState.comments[taskId] || [];
    if (existingComments.length >= 50) {
      alert('Maximum number of comments reached for this task (50).');
      return;
    }

    const newComment: Comment = {
      author: author.substring(0, 50), // Extra safety
      text: text.substring(0, 1000),
      timestamp: Date.now()
    };

    const newComments = {
      ...appState.comments,
      [taskId]: [...existingComments, newComment]
    };
    
    console.log(`Adding comment to task ${taskId}:`, newComment);
    console.log('Updated comments for task:', newComments[taskId]);
    
    // For internal view, track activity
    let updates: Partial<AppState> = { comments: newComments };
    if (isInternal) {
      // Find task details for activity log
      let taskTitle = '';
      let phaseId = '';
      let phaseTitle = '';
      
      for (const phase of data.phases) {
        const task = phase.tasks.find(t => t.id === taskId);
        if (task) {
          taskTitle = task.title;
          phaseId = phase.id;
          phaseTitle = phase.title;
          break;
        }
      }
      
      // Check user tasks if not found in regular phases
      if (!taskTitle && appState.userTasks) {
        const userTask = appState.userTasks.find(t => t.id === taskId);
        if (userTask) {
          taskTitle = userTask.title;
          phaseId = 'phase7';
          phaseTitle = 'Phase 7: User Submissions';
        }
      }
      
      // Create activity entry
      const activityEntry: ActivityEntry = {
        id: `activity-${Date.now()}-${Math.random()}`,
        type: 'comment_added',
        taskId,
        taskTitle,
        phaseId,
        phaseTitle,
        updatedBy: author, // Use the comment author
        timestamp: Date.now(),
        details: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      };
      
      const currentLog = appState.activityLog || [];
      updates.activityLog = [...currentLog, activityEntry];
    }

    saveData(updates);
  };

  const deleteComment = (taskId: string, commentIndex: number) => {
    const taskComments = [...(appState.comments[taskId] || [])];
    taskComments.splice(commentIndex, 1);
    
    const newComments = {
      ...appState.comments,
      [taskId]: taskComments
    };
    
    saveData({ comments: newComments });
  };

  const submitNewTask = (name: string, taskName: string, description: string, honeypot: string) => {
    // Check honeypot (anti-bot)
    if (honeypot) {
      // Bot detected - silently fail
      return;
    }
    
    if (!name.trim() || !taskName.trim() || !description.trim()) {
      alert('Please fill in all fields to submit a task request.');
      return;
    }
    
    // Client-side length validation
    if (taskName.length > 100) {
      alert('Task name is too long (maximum 100 characters)');
      return;
    }
    
    if (description.length > 500) {
      alert('Description is too long (maximum 500 characters)');
      return;
    }
    
    if (name.length > 50) {
      alert('Name is too long (maximum 50 characters)');
      return;
    }
    
    // Check if we've hit the task limit
    if (appState.userTasks.length >= 100) {
      alert('Maximum number of task submissions reached (100). Please contact an administrator.');
      return;
    }

    const newTask: Task = {
      id: 'user-' + Date.now(),
      title: taskName.substring(0, 100), // Extra safety
      author: name.substring(0, 50),
      description: description.substring(0, 500),
      timestamp: Date.now()
    };

    saveData({ userTasks: [...appState.userTasks, newTask] });
    
    alert('Task request submitted successfully!');
  };

  const requestNewTask = () => {
    setExpandedPhases(prev => ({ ...prev, phase7: true }));
    setTimeout(() => {
      document.getElementById('phase7')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const dismissActivity = (activityId: string) => {
    const newDismissed = new Set(dismissedActivityIds);
    newDismissed.add(activityId);
    setDismissedActivityIds(newDismissed);
    localStorage.setItem('tekoma_dismissed_activities', JSON.stringify(Array.from(newDismissed)));
    
    // Remove from recent activities
    setRecentActivities(prev => prev.filter(a => a.id !== activityId));
    
    // Check if any activities remain
    const remainingActivities = recentActivities.filter(a => a.id !== activityId);
    if (remainingActivities.length === 0) {
      setHasNewActivity(false);
      setActivitySummary('');
      setPhaseActivity({});
    }
  };
  
  const dismissAllActivities = () => {
    const newDismissed = new Set(dismissedActivityIds);
    recentActivities.forEach(activity => {
      newDismissed.add(activity.id);
    });
    setDismissedActivityIds(newDismissed);
    localStorage.setItem('tekoma_dismissed_activities', JSON.stringify(Array.from(newDismissed)));
    
    setRecentActivities([]);
    setHasNewActivity(false);
    setActivitySummary('');
    setPhaseActivity({});
  };

  const calculateStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    data.phases.forEach(phase => {
      if (!phase.isUserSubmitted) {
        phase.tasks.forEach(task => {
          totalTasks++;
          if (appState.tasks[task.id]) {
            completedTasks++;
          }
        });
      }
    });

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalTasks, completedTasks, percentage };
  };

  const stats = calculateStats();

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <>
      <div className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>Website Refresh Project Tracker</h1>
            <p className="subtitle">
              Tekoma Energy Website Refresh
              {isInternal && <span style={{ marginLeft: '10px', color: '#ff9947' }}>[Internal View]</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isInternal && hasNewActivity && (
              <div style={{
                position: 'relative',
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#92400e',
                maxWidth: '400px',
                cursor: 'pointer'
              }}
              onClick={() => setShowActivityPanel(!showActivityPanel)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>New activity ({recentActivities.length}):</strong>
                  <span style={{ flex: 1 }}>{activitySummary}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Click to view</span>
                </div>
              </div>
            )}
            <button 
              className="request-button" 
              onClick={() => loadData()} 
              title={isInternal && hasNewActivity ? `Click to refresh and see changes` : "Refresh data from server"}
              style={{ position: 'relative' }}
            >
              Refresh
              {isInternal && hasNewActivity && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#f97316',
                  borderRadius: '50%',
                  border: '2px solid white',
                  animation: 'pulse 2s infinite'
                }}></span>
              )}
            </button>
            <button className="request-button" onClick={requestNewTask}>
              Request New Task
            </button>
          </div>
        </div>
      </div>

      {isInternal && showActivityPanel && recentActivities.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '400px',
          maxHeight: '500px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Recent Activity</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={dismissAllActivities}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowActivityPanel(false)}
                style={{
                  padding: '4px 8px',
                  fontSize: '1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          </div>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '10px'
          }}>
            {recentActivities.map(activity => (
              <div
                key={activity.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.85rem',
                  position: 'relative'
                }}
              >
                <button
                  onClick={() => dismissActivity(activity.id)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}
                  title="Dismiss this notification"
                >
                  ×
                </button>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1f2937' }}>
                  {activity.updatedBy}
                  {activity.type === 'task_completed' && ' completed a task'}
                  {activity.type === 'task_uncompleted' && ' uncompleted a task'}
                  {activity.type === 'comment_added' && ' added a comment'}
                  {activity.type === 'comment_deleted' && ' deleted a comment'}
                  {activity.type === 'user_task_submitted' && ' submitted a new task'}
                </div>
                <div style={{ color: '#4b5563', marginBottom: '2px' }}>
                  <strong>Task:</strong> {activity.taskTitle}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '2px' }}>
                  <strong>Phase:</strong> {activity.phaseTitle}
                </div>
                {activity.details && (
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', fontStyle: 'italic' }}>
                    "{activity.details}"
                  </div>
                )}
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '4px' }}>
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="progress-section">
        <div className="progress-content">
          <div className="progress-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.percentage}%</div>
              <div className="stat-label">Progress</div>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.percentage}%` }}></div>
            </div>
            <div className="progress-label">Project Completion Status</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {data.phases.map(phase => {
          const phaseTasks = phase.isUserSubmitted ? appState.userTasks : phase.tasks;
          const completedInPhase = phaseTasks.filter(t => appState.tasks[t.id]).length;

          return (
            <div className="phase" key={phase.id} id={phase.id}>
              <div className="phase-header" onClick={() => togglePhase(phase.id)}>
                <div className="phase-title">
                  <span className={`phase-arrow ${expandedPhases[phase.id] ? 'active' : ''}`}>
                    ▶
                  </span>
                  {phase.title}
                  {phase.id === 'phase7' && newTaskCount > 0 && (
                    <span className="notification-badge">{newTaskCount}</span>
                  )}
                  {isInternal && phaseActivity[phase.id] && (
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#f97316',
                      borderRadius: '50%',
                      marginLeft: '8px',
                      verticalAlign: 'middle'
                    }}></span>
                  )}
                </div>
                <div className="phase-meta">
                  <span>
                    {completedInPhase} of {phaseTasks.length} tasks{' '}
                    {phase.isUserSubmitted ? 'requested' : 'complete'}
                  </span>
                </div>
              </div>
              
              <div className={`phase-content ${expandedPhases[phase.id] ? 'active' : ''}`}>
                {phase.isUserSubmitted && (
                  <div className="new-task-form">
                    <h3>Submit a New Task Request</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const name = (form.elements.namedItem('requester-name') as HTMLInputElement).value;
                      const taskName = (form.elements.namedItem('task-name') as HTMLInputElement).value;
                      const description = (form.elements.namedItem('task-description') as HTMLTextAreaElement).value;
                      const honeypot = (form.elements.namedItem('website') as HTMLInputElement).value;
                      
                      submitNewTask(name, taskName, description, honeypot);
                      form.reset();
                    }}>
                      {/* Honeypot field - hidden from users, visible to bots */}
                      <input 
                        type="text" 
                        name="website" 
                        style={{ position: 'absolute', left: '-9999px' }}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                      />
                      <div className="form-group">
                        <label htmlFor="requester-name">Your Name</label>
                        <input 
                          type="text" 
                          name="requester-name" 
                          placeholder="Enter your name" 
                          maxLength={50}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="task-name">Task Name</label>
                        <input 
                          type="text" 
                          name="task-name" 
                          placeholder="Brief title for the task (max 100 characters)" 
                          maxLength={100}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="task-description">Task Description</label>
                        <textarea 
                          name="task-description" 
                          placeholder="Describe what needs to be done and why (max 500 characters)" 
                          maxLength={500}
                        ></textarea>
                      </div>
                      <button type="submit" className="form-submit">Submit Task Request</button>
                    </form>
                  </div>
                )}

                {phase.isUserSubmitted ? (
                  appState.userTasks.map(task => (
                    <div className={`task ${!seenTaskIds.has(task.id) ? 'new-task' : ''}`} key={task.id}>
                      <div className="task-header">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={appState.tasks[task.id] || false}
                          onChange={() => toggleTask(task.id)}
                        />
                        <div className="task-content">
                          <div className="task-title">
                            <span className="task-code">USER-REQ</span>
                            {task.title}
                          </div>
                          <div className="task-meta">
                            <span>Source: {task.author} - {new Date(task.timestamp || Date.now()).toLocaleDateString()}</span>
                          </div>
                          {task.description && (
                            <div className="task-justification">{task.description}</div>
                          )}
                          <div className="comments-section">
                            <div className="comments-list">
                              {(appState.comments[task.id] || []).map((comment, idx) => (
                                <div className="comment" key={idx}>
                                  <div className="comment-header">
                                    <span className="comment-author">{comment.author}</span>
                                    <span className="comment-time">
                                      {new Date(comment.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="comment-text">{comment.text}</div>
                                  <button 
                                    className="comment-delete"
                                    onClick={() => deleteComment(task.id, idx)}
                                    title="Delete comment"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <form className="add-comment" onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const name = (form.elements.namedItem(`name-${task.id}`) as HTMLInputElement).value;
                              const text = (form.elements.namedItem(`comment-${task.id}`) as HTMLTextAreaElement).value;
                              
                              addComment(task.id, name, text);
                              form.reset();
                            }}>
                              <input type="text" name={`name-${task.id}`} placeholder="Your name" maxLength={50} />
                              <textarea name={`comment-${task.id}`} placeholder="Add a note... (max 1000 characters)" maxLength={1000}></textarea>
                              <button type="submit">Add Note</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  phase.tasks.map(task => (
                    <div className="task" key={task.id}>
                      <div className="task-header">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={appState.tasks[task.id] || false}
                          onChange={() => toggleTask(task.id)}
                        />
                        <div className="task-content">
                          <div className="task-title">
                            <span className="task-code">{task.code}</span>
                            {task.title}
                            {isInternal && task.time && (
                              <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#6b7280' }}>
                                ({task.time} min)
                              </span>
                            )}
                          </div>
                          <div className="task-meta">
                            <span>Source: {task.source}</span>
                          </div>
                          {task.justification && (
                            <div className="task-justification">{task.justification}</div>
                          )}
                          {task.action && (
                            <div style={{ marginTop: '10px', padding: '10px', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.9rem' }}>
                              <strong>Action:</strong> {task.action}
                            </div>
                          )}
                          {isInternal && task.wixSteps && task.wixSteps.length > 0 && (
                            <div style={{ marginTop: '15px', padding: '15px', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #0284c7' }}>
                              <div style={{ fontWeight: '600', marginBottom: '10px', color: '#0c4a6e' }}>
                                Wix Execution Steps:
                              </div>
                              <ol style={{ marginLeft: '20px', color: '#334155', fontSize: '0.9rem', lineHeight: '1.8' }}>
                                {task.wixSteps.map((step, idx) => (
                                  <li key={idx} style={{ marginBottom: '5px' }}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          <div className="comments-section">
                            <div className="comments-list">
                              {(appState.comments[task.id] || []).map((comment, idx) => (
                                <div className="comment" key={idx}>
                                  <div className="comment-header">
                                    <span className="comment-author">{comment.author}</span>
                                    <span className="comment-time">
                                      {new Date(comment.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="comment-text">{comment.text}</div>
                                  <button 
                                    className="comment-delete"
                                    onClick={() => deleteComment(task.id, idx)}
                                    title="Delete comment"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <form className="add-comment" onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const name = (form.elements.namedItem(`name-${task.id}`) as HTMLInputElement).value;
                              const text = (form.elements.namedItem(`comment-${task.id}`) as HTMLTextAreaElement).value;
                              
                              addComment(task.id, name, text);
                              form.reset();
                            }}>
                              <input type="text" name={`name-${task.id}`} placeholder="Your name" maxLength={50} />
                              <textarea name={`comment-${task.id}`} placeholder="Add a note... (max 1000 characters)" maxLength={1000}></textarea>
                              <button type="submit">Add Note</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="footer">
        <div className="logo-container">
          <TekomaLogo />
          <div className="portfolio-text">A portfolio company of HSBC Asset Management</div>
        </div>
      </div>
    </>
  );
}

export default function ProjectTracker() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>}>
      <ProjectTrackerContent />
    </Suspense>
  );
}