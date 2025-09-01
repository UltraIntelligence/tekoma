'use client';

import { useState, useEffect } from 'react';
import { projectData } from '@/lib/data';
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

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    tasks: {},
    comments: {},
    userTasks: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setAppState(data);
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

    const newComment: Comment = {
      author,
      text,
      timestamp: Date.now()
    };

    const newComments = {
      ...appState.comments,
      [taskId]: [...(appState.comments[taskId] || []), newComment]
    };

    saveData({ comments: newComments });
  };

  const submitNewTask = (name: string, taskName: string, description: string) => {
    if (!name.trim() || !taskName.trim() || !description.trim()) {
      alert('Please fill in all fields to submit a task request.');
      return;
    }

    const newTask: Task = {
      id: 'user-' + Date.now(),
      title: taskName,
      author: name,
      description: description,
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

    projectData.phases.forEach(phase => {
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
            <p className="subtitle">Tekoma Energy Website Refresh</p>
          </div>
          <button className="request-button" onClick={requestNewTask}>
            Request New Task
          </button>
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
        {projectData.phases.map(phase => {
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
                      
                      submitNewTask(name, taskName, description);
                      form.reset();
                    }}>
                      <div className="form-group">
                        <label htmlFor="requester-name">Your Name</label>
                        <input type="text" name="requester-name" placeholder="Enter your name" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="task-name">Task Name</label>
                        <input type="text" name="task-name" placeholder="Brief title for the task" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="task-description">Task Description</label>
                        <textarea name="task-description" placeholder="Describe what needs to be done and why"></textarea>
                      </div>
                      <button type="submit" className="form-submit">Submit Task Request</button>
                    </form>
                  </div>
                )}

                {phase.isUserSubmitted ? (
                  appState.userTasks.map(task => (
                    <div className="user-task" key={task.id}>
                      <div className="user-task-header">
                        <div className="user-task-title">{task.title}</div>
                        <div className="user-task-author">Requested by: {task.author}</div>
                      </div>
                      <div className="user-task-description">{task.description}</div>
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
                          </div>
                          <div className="task-meta">
                            <span>Source: {task.source}</span>
                          </div>
                          {task.justification && (
                            <div className="task-justification">{task.justification}</div>
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
                              <input type="text" name={`name-${task.id}`} placeholder="Your name" />
                              <textarea name={`comment-${task.id}`} placeholder="Add a note..."></textarea>
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