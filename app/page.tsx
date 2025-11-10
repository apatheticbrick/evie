"use client";

import React, { useState, useEffect } from "react";
import "./page.css";
import TaskCard from "./components/taskcard";
import Task from "./classes/task";

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [draftBodyText, setDraftBodyText] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<null | Task>(null);
  const [toasts, setToasts] = useState([]);

  const [tasks, setTasks] = useState({ tasks: Array<Task>() });
  const [completedTasks, setCompletedTasks] = useState({
    tasks: Array<Task>(),
  });

  // Use useEffect to load data from localStorage on the client
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
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
    setDraftTitle("");
    setDraftBodyText("");
    // Clear the text when closing
  };

  //confirm modal asks the user to confirm when they want to close the modal with text inside
  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmModalConfirm = () => {
    setShowConfirmModal(false);
    handleCloseModal();
    handleCloseEditModal();
  };

  //edit modal allows the user to update tasks
  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setDraftTitle("");
    setDraftBodyText("");
    setEditingTask(null);
  };

  const handleConfirmModalCancel = () => {
    setShowConfirmModal(false);
  };

  //triggers the confirm modal if there's text in there
  const handleTryCloseModal = () => {
    if (showModal) {
      if (draftTitle === "" && draftBodyText === "") {
        handleCloseModal();
      } else {
        handleOpenConfirmModal();
      }
      //if the user is editing, only show the confirm modal if they have edited text
    } else if (showEditModal && editingTask) {
      if (
        draftTitle === editingTask.title &&
        draftBodyText === editingTask.body
      ) {
        handleCloseEditModal();
      } else {
        handleOpenConfirmModal();
      }
    }
  };

  //Ping the discord API, then add the new task to the task dictionary, then close the modal.
  const handleAddTask = () => {
    console.log("handleAddTask");
    if (draftTitle.trim() !== "") {
      sendDiscordMessage(`Evie just added the task: "${draftTitle}"`);
      const newID = Date.now();
      const newTask = new Task(newID, draftTitle, draftBodyText);
      setTasks({ tasks: [...tasks.tasks, newTask] });
      // setTasks({"tasks": tasks.tasks, newTask});
      handleCloseModal();
    } else if (draftBodyText == "") {
      handleCloseModal();
      //if no title or body text, close window instead
    } else {
      //tell the user that they need a title.
    }
  };

  //replace the old task with the new one, then close the edit modal.
  const handleUpdateTask = () => {
    if (draftTitle.trim() !== "" && editingTask) {
      const updatedTasks = tasks.tasks.map((task) =>
        task.id === editingTask.id
          ? { ...task, title: draftTitle, body: draftBodyText }
          : task,
      );
      setTasks({ tasks: updatedTasks });
      handleCloseEditModal();
    } else if (draftBodyText === "") {
      handleCloseEditModal();
    }
  };

  //Remove the task from the tasks and add it to completed task, then ping the API to send a message to the discord.
  const handleCompleteTask = (id: number) => {
    const taskToComplete = tasks.tasks.find((task) => task.id === id);
    if (taskToComplete) {
      setTasks({ tasks: tasks.tasks.filter((task) => task.id !== id) });
      setCompletedTasks({ tasks: [...completedTasks.tasks, taskToComplete] });
    }
    sendDiscordMessage(`Evie just completed: "${taskToComplete?.title}"!`);
  };

  //Remove the task from completed tasks, add it to tasks, then ping the API.
  const handleUncompleteTask = (id: number) => {
    const taskToUncomplete = completedTasks.tasks.find(
      (task) => task.id === id,
    );
    if (taskToUncomplete) {
      setCompletedTasks({
        tasks: completedTasks.tasks.filter((task) => task.id !== id),
      });
      setTasks({ tasks: [...tasks.tasks, taskToUncomplete] });
      sendDiscordMessage(`Evie just added the task: ${taskToUncomplete.title}`);
    }
  };

  //Set the task to edit mode, fill in the title and body text with the text from that task, then show the edit modal
  const handleEditTask = (id) => {
    const taskToEdit = tasks.tasks.find((task) => task.id === id);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setDraftTitle(taskToEdit.title);
      setDraftBodyText(taskToEdit.body);
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
      const response = await fetch("/api/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        addToast("Success", "Task completion logged on Discord.", "success");
      } else {
        const errorData = await response.json();
        addToast(
          "API Error",
          `Failed to send message: ${errorData.error}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Network or server error:", error);
      addToast("Network or server error", error, "error");
    }
  };

  //add a toast with the necessary info, then start the timer to make it disappear (for some reason this doesn't fully work yet idk why)
  const addToast = (title, message, type = "info") => {
    const id = Date.now();
    const newToast = { id, title, message, type, isFadingOut: false };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Set a timeout to start the fade-out animation
    setTimeout(() => {
      setToasts((prevToasts) =>
        prevToasts.map((toast) =>
          toast.id === id ? { ...toast, isFadingOut: true } : toast,
        ),
      );
    }, 4500); // Start fade-out animation 500ms before it's removed

    // Remove the toast from state after the animation completes
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  };

  //defines the toast object and the HTML it should output
  const Toast = ({ title, message, type, isFadingOut }) => {
    const className = `toast toast--${type} ${isFadingOut ? "fading-out" : ""}`;
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

  //localStorage should update every time the task or completed task dictionaries are updated
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  }, [tasks, completedTasks]);

  //manage some basic keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      //Escape should close the current modal
      if (event.key === "Escape") {
        console.log("escape key detected");
        if (!showConfirmModal) {
          handleTryCloseModal();
        } else {
          handleConfirmModalCancel();
        }
      }
      //control+enter should add the task (don't think this works yet because the page overrides it)
      if (event.keyCode === 13) {
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
      if (event.key === "n" && event.ctrlKey) {
        event.preventDefault();
        handleOpenModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTryCloseModal, handleOpenModal]); // The effect re-runs when showModal changes

  return (
    <div className="main-container">
      <h1>Evie stop procrastinating!!!!!!!!!!!</h1>
      <ToastContainer />
      <button
        title="(ctrl+n)"
        className="general-button"
        onClick={handleOpenModal}
      >
        Add a New Task
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add a New Task</h3>
              <button
                title="(esc)"
                className="close-button"
                onClick={handleTryCloseModal}
              >
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
                rows="8"
                className="input-body"
              />
            </div>
            <div className="modal-footer">
              <button className="general-button" onClick={handleAddTask}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button
                title="(esc)"
                className="close-button"
                onClick={handleCloseEditModal}
              >
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
                rows="8"
                className="input-body"
              />
            </div>
            <div className="modal-footer">
              <button className="general-button" onClick={handleUpdateTask}>
                Update
              </button>
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
              <button
                className="cancel-button"
                onClick={handleConfirmModalCancel}
              >
                Cancel
              </button>
              <button
                className="discard-button"
                onClick={handleConfirmModalConfirm}
              >
                Discard
              </button>
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
              <p>
                You've finished all your tasks! Good
                job!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              </p>
            )
          ) : (
            <ul className="tasks-container">
              {tasks.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onEdit={() => handleEditTask(task.id)}
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
          <span className="dropdown-arrow">
            {showCompletedTasks ? "▼" : "►"}
          </span>
        </h2>
        <div
          className={`completed-dropdown-content ${showCompletedTasks ? "expanded" : ""}`}
        >
          {completedTasks.tasks.length === 0 ? (
            <p>No completed tasks yet.</p>
          ) : (
            <ul className="tasks-container">
              {completedTasks.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUncomplete={handleUncompleteTask}
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
