'use client';

import React, { useState, useEffect } from 'react';
import './page.css';
import TaskCard from './components/taskcard';

class Task {
  id: number;
  title: string;
  body: string;
  isRecurring: boolean;
  recurrenceDays: number; // e.g., 7 for weekly, 1 for daily, 30 for monthly
  lastPingTimestamp: number; // The timestamp of the last time a Discord ping was sent
  checkedUntil: number; // Timestamp until which this recurring task is checked off (0 if not checked)

  constructor(
    id: number,
    title: string,
    body: string,
    isRecurring: boolean = false,
    recurrenceDays: number = 0,
    lastPingTimestamp: number = 0, // Initialized to 0 or the task's creation ID
    checkedUntil: number = 0 // Timestamp until which task is checked off
  ) {
    this.id = id;
    this.title = title;
    this.body = body;
    // New fields
    this.isRecurring = isRecurring;
    this.recurrenceDays = recurrenceDays;
    this.lastPingTimestamp = lastPingTimestamp || id; // Set last ping to task creation time
    this.checkedUntil = checkedUntil || 0;
  }
}


const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [draftBodyText, setDraftBodyText] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<Array<{id: number; title: string; message: string; type: string; isFadingOut: boolean}>>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState(7);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceDays, setEditRecurrenceDays] = useState(7);

  const [tasks, setTasks] = useState<{tasks: Task[]}>({ "tasks": [] });
  const [completedTasks, setCompletedTasks] = useState<{tasks: Task[]}>({ "tasks": [] });

  // Use useEffect to load data from localStorage on the client
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      setTasks(parsedTasks);
      // Sync recurring tasks after loading
      const savedCompletedTasks = localStorage.getItem("completedTasks");
      const parsedCompletedTasks = savedCompletedTasks ? JSON.parse(savedCompletedTasks) : { tasks: [] };
      const allTasks = [...parsedTasks.tasks, ...parsedCompletedTasks.tasks];
      const recurringTasks = allTasks.filter((task: Task) => task.isRecurring);
      if (recurringTasks.length > 0) {
        fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tasks: recurringTasks }),
        }).catch(error => console.error('Error syncing recurring tasks on load:', error));
      }
    }
    const savedCompletedTasks = localStorage.getItem("completedTasks");
    if (savedCompletedTasks) {
      setCompletedTasks(JSON.parse(savedCompletedTasks));
    }
  }, []);

  console.log(tasks);
  //creating functions that can be called later, that way buttons do something.
  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDraftTitle('');
    setDraftBodyText('');
    setIsRecurring(false);
    setRecurrenceDays(7);
    // Clear the text when closing
  };

  //confirm modal asks the user to confirm when they want to close the modal with text inside
  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true);
  }

  const handleConfirmModalConfirm = () => {
    setShowConfirmModal(false);
    handleCloseModal();
    handleCloseEditModal();
  }

  //edit modal allows the user to update tasks
  const handleOpenEditModal = () => {
    setShowEditModal(true);
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setDraftTitle('');
    setDraftBodyText('');
    setEditingTask(null);
    setEditIsRecurring(false);
    setEditRecurrenceDays(7);
  }

  const handleConfirmModalCancel = () => {
    setShowConfirmModal(false);
  }

  //triggers the confirm modal if there's text in there
  const handleTryCloseModal = () => {
    if (showModal) {
      if (draftTitle === '' && draftBodyText === '') {
        handleCloseModal();
      } else {
        handleOpenConfirmModal();
      }
    //if the user is editing, only show the confirm modal if they have edited text
    } else if (showEditModal && editingTask) {
      if (draftTitle === editingTask.title && draftBodyText === editingTask.body) {
        handleCloseEditModal();
      } else {
        handleOpenConfirmModal();
      }
    }
  };

  //Sync recurring tasks to the server
  const syncRecurringTasksToServer = React.useCallback(async () => {
    try {
      const allTasks = [...tasks.tasks, ...completedTasks.tasks];
      const recurringTasks = allTasks.filter(task => task.isRecurring);
      if (recurringTasks.length > 0) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tasks: recurringTasks }),
        });
      }
    } catch (error) {
      console.error('Error syncing recurring tasks:', error);
    }
  }, [tasks.tasks, completedTasks.tasks]);

  //Ping the discord API, then add the new task to the task dictionary, then close the modal.
  const handleAddTask = () => {
    console.log("handleAddTask")
    if (draftTitle.trim() !== '') {
      sendDiscordMessage(`Evie just added the task: "${draftTitle}"`);
      const newID = Date.now()
      const newTask = new Task(
        newID, 
        draftTitle, 
        draftBodyText,
        isRecurring,
        isRecurring ? recurrenceDays : 0,
        newID, // Set lastPingTimestamp to creation time
        0 // checkedUntil starts at 0
      )
      setTasks({"tasks": [...tasks.tasks, newTask]});
      // setTasks({"tasks": tasks.tasks, newTask});
      handleCloseModal();
      // Sync recurring tasks to server if this is a recurring task
      if (isRecurring) {
        setTimeout(() => syncRecurringTasksToServer(), 100);
      }
    } else if (draftBodyText == '') {
      handleCloseModal();
      //if no title or body text, close window instead
    } else {
      //tell the user that they need a title.
    }
  };

  //replace the old task with the new one, then close the edit modal.
  const handleUpdateTask = () => {
    if (draftTitle.trim() !== '' && editingTask) {
      const updatedTask = {
        ...editingTask,
        title: draftTitle,
        body: draftBodyText,
        isRecurring: editIsRecurring,
        recurrenceDays: editIsRecurring ? editRecurrenceDays : 0,
        checkedUntil: editIsRecurring ? editingTask.checkedUntil : 0
      };
      const updatedTasks = tasks.tasks.map(task => 
        task.id === editingTask.id ? updatedTask : task
      );
      setTasks({"tasks": updatedTasks});
      handleCloseEditModal();
    } else if (draftBodyText === '') {
      handleCloseEditModal();
    }
  };

  //Check off a recurring task for this interval (stays in current tasks, gets grayed out)
  const handleCheckOffRecurringTask = (id: number) => {
    const taskToCheck = tasks.tasks.find(task => task.id === id);
    if (taskToCheck && taskToCheck.isRecurring) {
      const now = Date.now();
      const checkedUntil = now + (taskToCheck.recurrenceDays * 24 * 60 * 60 * 1000);
      const updatedTask = { ...taskToCheck, checkedUntil };
      const updatedTasks = tasks.tasks.map(task => 
        task.id === id ? updatedTask : task
      );
      setTasks({ "tasks": updatedTasks });
      sendDiscordMessage(`Evie checked off recurring task: "${taskToCheck.title}" for this interval!`);
    }
  };

  //Cancel recurring status on a task (makes it a one-time task)
  const handleCancelRecurring = (id: number) => {
    const taskToUpdate = tasks.tasks.find(task => task.id === id);
    if (taskToUpdate && taskToUpdate.isRecurring) {
      const updatedTask = { 
        ...taskToUpdate, 
        isRecurring: false, 
        recurrenceDays: 0,
        checkedUntil: 0
      };
      const updatedTasks = tasks.tasks.map(task => 
        task.id === id ? updatedTask : task
      );
      setTasks({ "tasks": updatedTasks });
      sendDiscordMessage(`Evie canceled recurring status for: "${taskToUpdate.title}"`);
    }
  };

  //Remove the task from the tasks and add it to completed task, then ping the API to send a message to the discord.
  const handleCompleteTask = (id: number) => {
    const taskToComplete = tasks.tasks.find(task => task.id === id);
    if (taskToComplete) {
      // If it's a recurring task, don't complete it - use check off instead
      if (taskToComplete.isRecurring) {
        handleCheckOffRecurringTask(id);
        return;
      }
      setTasks({ "tasks": tasks.tasks.filter(task => task.id !== id) });
      setCompletedTasks({ "tasks": [...completedTasks.tasks, taskToComplete] });
      sendDiscordMessage(`Evie just completed: "${taskToComplete.title}"!`);
    }
  };

  //Remove the task from completed tasks, add it to tasks, then ping the API.
  const handleUncompleteTask = (id: number) => {
    const taskToUncomplete = completedTasks.tasks.find(task => task.id === id);
    if (taskToUncomplete) {
      setCompletedTasks({ "tasks": completedTasks.tasks.filter(task => task.id !== id) });
      setTasks({ "tasks": [...tasks.tasks, taskToUncomplete] });
      sendDiscordMessage(`Evie just added the task: ${taskToUncomplete.title}`);
    }
  };

  //Set the task to edit mode, fill in the title and body text with the text from that task, then show the edit modal
  const handleEditTask = (id: number) => {
    const taskToEdit = tasks.tasks.find(task => task.id === id);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setDraftTitle(taskToEdit.title);
      setDraftBodyText(taskToEdit.body);
      setEditIsRecurring(taskToEdit.isRecurring);
      setEditRecurrenceDays(taskToEdit.isRecurring ? taskToEdit.recurrenceDays : 7);
      handleOpenEditModal();
    }
  };

  //basically just for the HTML to work
  const toggleCompletedTasks = () => {
    setShowCompletedTasks(!showCompletedTasks);
  };

  //send a POST request to the backend with the message, then report any errors to the browser console, as well as adding a toast if there is an error.
  const sendDiscordMessage = async (message: string) => {
    try {
      console.log("sendDiscordMessage");
      const response = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        addToast('Success', 'Task completion logged on Discord.', 'success');
      } else {
        const errorData = await response.json();
        addToast('API Error', `Failed to send message: ${errorData.error}`, 'error');
      }
    } catch (error) {
      console.error('Network or server error:', error);
      addToast('Network or server error', String(error), 'error');
    }
  };

  //add a toast with the necessary info, then start the timer to make it disappear (for some reason this doesn't fully work yet idk why)
  const addToast = (title: string, message: string, type: string = 'info') => {
    const id = Date.now();
    const newToast = { id, title, message, type, isFadingOut: false };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Set a timeout to start the fade-out animation
    setTimeout(() => {
      setToasts((prevToasts) =>
        prevToasts.map((toast) =>
          toast.id === id ? { ...toast, isFadingOut: true } : toast
        )
      );
    }, 4500); // Start fade-out animation 500ms before it's removed

    // Remove the toast from state after the animation completes
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  };

  //defines the toast object and the HTML it should output
  const Toast = ({ title, message, type, isFadingOut }: {title: string; message: string; type: string; isFadingOut: boolean}) => {
    const className = `toast toast--${type} ${isFadingOut ? 'fading-out' : ''}`;
    return (
      <div className={className} role="alert">
        <div className="toast__title">{title}</div>
        <div className="toast__message">{message}</div>
      </div>
    );
  };

  // Container component to hold and display all toasts
  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );

  // Reset checked-off recurring tasks when their interval expires
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const updatedTasks = tasks.tasks.map(task => {
        if (task.isRecurring && task.checkedUntil > 0 && now >= task.checkedUntil) {
          // Interval has passed, reset the checked state
          return { ...task, checkedUntil: 0 };
        }
        return task;
      });
      
      // Only update if something changed
      const hasChanges = updatedTasks.some((task, index) => 
        task.checkedUntil !== tasks.tasks[index]?.checkedUntil
      );
      
      if (hasChanges) {
        setTasks({ "tasks": updatedTasks });
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [tasks.tasks]);

  //localStorage should update every time the task or completed task dictionaries are updated
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    // Sync recurring tasks to server whenever tasks change
    syncRecurringTasksToServer();
  }, [tasks, completedTasks, syncRecurringTasksToServer]);

  //manage some basic keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      //Escape should close the current modal
      if (event.key === 'Escape') {
        console.log("escape key detected")
        if (!showConfirmModal) {
          handleTryCloseModal();
        } else {
          handleConfirmModalCancel();
        }
      }
      //control+enter should add the task (don't think this works yet because the page overrides it)
      if(event.keyCode === 13) {
        if (showConfirmModal) {
          handleConfirmModalConfirm();
        }
        if (showModal) {
          if (event.ctrlKey) {
            event.preventDefault();
            handleAddTask();
          }
        }
        if (showEditModal) {
          if (event.ctrlKey) {
            event.preventDefault();
            handleUpdateTask();
          }
        }
      }
      //control+n should open a new task but agian I don't think this works yet.
      if (event.key === 'n' && (event.ctrlKey)) {
        event.preventDefault();
        handleOpenModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
              document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTryCloseModal, handleOpenModal]); // The effect re-runs when showModal changes

  return (

    <div className="main-container">
      <h1>Evie stop procrastinating!!!!!!!!!!!</h1>
      <ToastContainer />
      <button title="(ctrl+n)" className="general-button" onClick={handleOpenModal}>
        Add a New Task
      </button>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add a New Task</h3>
              <button title="(esc)" className="close-button" onClick={handleTryCloseModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="input-container">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value.slice(0, 100))}
                  placeholder="Title"
                  className="input-title"
                />
                <span className="char-counter">{draftTitle.length}/100</span>
              </div>
              <textarea
                value={draftBodyText}
                onChange={(e) => setDraftBodyText(e.target.value)}
                placeholder="Start typing a description (optional)..."
                rows={8}
                className="input-body"
              />
              <div className="recurring-task-section">
                <label className="recurring-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="recurring-checkbox"
                  />
                  <span>Make this task recurring</span>
                </label>
                {isRecurring && (
                  <div className="recurrence-input-container">
                    <label htmlFor="recurrence-days" className="recurrence-label">
                      Repeat every:
                    </label>
                    <input
                      id="recurrence-days"
                      type="number"
                      min="1"
                      value={recurrenceDays}
                      onChange={(e) => setRecurrenceDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="recurrence-days-input"
                    />
                    <span className="recurrence-days-label">days</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="general-button" onClick={handleAddTask}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button title="(esc)" className="close-button" onClick={handleCloseEditModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="input-container">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value.slice(0, 100))}
                  placeholder="Title"
                  className="input-title"
                />
                <span className="char-counter">{draftTitle.length}/100</span>
              </div>
              <textarea
                value={draftBodyText}
                onChange={(e) => setDraftBodyText(e.target.value)}
                placeholder="Start typing a description (optional)..."
                rows={8}
                className="input-body"
              />
              <div className="recurring-task-section">
                <label className="recurring-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editIsRecurring}
                    onChange={(e) => setEditIsRecurring(e.target.checked)}
                    className="recurring-checkbox"
                  />
                  <span>Make this task recurring</span>
                </label>
                {editIsRecurring && (
                  <div className="recurrence-input-container">
                    <label htmlFor="edit-recurrence-days" className="recurrence-label">
                      Repeat every:
                    </label>
                    <input
                      id="edit-recurrence-days"
                      type="number"
                      min="1"
                      value={editRecurrenceDays}
                      onChange={(e) => setEditRecurrenceDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="recurrence-days-input"
                    />
                    <span className="recurrence-days-label">days</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="general-button" onClick={handleUpdateTask}>Update</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="discard-modal">
            <div className="modal-header">
              <h3>Discard changes?</h3>
            </div>
            <div className="discard-cancel-footer">
              <button className="cancel-button" onClick={handleConfirmModalCancel}>Cancel</button>
              <button className="discard-button" onClick={handleConfirmModalConfirm}>Discard</button>    
            </div>
          </div>
        </div>
      )}

      <div className="tasks-list">
        <h2>Tasks</h2>
        <div>
          {tasks.tasks.length === 0 ? (
            completedTasks.tasks.length === 0 ? (
              <p>Add a task to get started!</p>
            ) : (
              <p>You've finished all your tasks! Good job!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!</p>
            )
          ) : (
            <ul className="tasks-container">
              {tasks.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onUncomplete={handleUncompleteTask}
                  onEdit={() => handleEditTask(task.id)}
                  onCancelRecurring={handleCancelRecurring}
                  isCompleted={false}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <hr className="divider" />

      <div className="completed-tasks-section">
        <h2 className="completed-header" onClick={toggleCompletedTasks}>
          Completed Tasks
          <span className="dropdown-arrow">{showCompletedTasks ? '▼' : '►'}</span>
        </h2>
        <div className={`completed-dropdown-content ${showCompletedTasks ? 'expanded' : ''}`}>
          {completedTasks.tasks.length === 0 ? (
            <p>No completed tasks yet.</p>
          ) : (
            <ul className="tasks-container">
              {completedTasks.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onUncomplete={handleUncompleteTask}
                  onEdit={() => handleEditTask(task.id)}
                  onCancelRecurring={handleCancelRecurring}
                  isCompleted={true}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;