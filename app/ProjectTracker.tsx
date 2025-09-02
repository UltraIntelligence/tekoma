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

  // Load data from API
  useEffect(() => {
    // Load seen tasks from localStorage
    const storedSeenTasks = localStorage.getItem('seenTaskIds');
    if (storedSeenTasks) {
      setSeenTaskIds(new Set(JSON.parse(storedSeenTasks)));
    }
    
    // Load initial data
    loadData();
    
    // POLLING DISABLED: Was causing comments to disappear
    // To re-enable: uncomment the lines below
    // const interval = setInterval(() => {
    //   loadData(true);
    // }, 30000);
    // 
    // return () => clearInterval(interval);
  }, []);
  
  // Update new task count when data changes
  useEffect(() => {
    const unseenTasks = appState.userTasks.filter(task => !seenTaskIds.has(task.id));
    setNewTaskCount(unseenTasks.length);
  }, [appState.userTasks, seenTaskIds]);

  const loadData = async (isPolling = false) => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
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
      
      setAppState(data);
      if (!isPolling) {
        setLastCheckTime(Date.now());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newState: Partial<AppState>) => {
    const updatedState = { ...appState, ...newState };
    setAppState(updatedState);
    
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState)
      });
    } catch (error) {
      console.error('Error saving data:', error);
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
    const newTasks = { ...appState.tasks, [taskId]: !appState.tasks[taskId] };
    saveData({ tasks: newTasks });
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

    saveData({ comments: newComments });
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="request-button" onClick={() => loadData()} title="Refresh data from server">
              🔄 Refresh
            </button>
            <button className="request-button" onClick={requestNewTask}>
              Request New Task
            </button>
          </div>
        </div>
      </div>

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