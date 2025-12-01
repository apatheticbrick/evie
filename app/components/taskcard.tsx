import React, { useState, useEffect } from 'react';
import '../page.css';

const TaskCard = ({ task, onComplete, onUncomplete, isCompleted, onEdit }: {
  task: { id: number; title: string; body: string };
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  isCompleted: boolean;
  onEdit: (id: number) => void;
}) => {
  const [timeElapsed, setTimeElapsed] = useState('');

  useEffect(() => {
    if (!isCompleted) {
      const interval = setInterval(() => {
        const now = Date.now();
        const created = task.id;
        const diff = now - created;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeString = '';
        if (days > 0) {
          timeString += `${days}d `;
        }
        if (hours > 0) {
          timeString += `${hours % 24}h `;
        }
        if (minutes > 0) {
          timeString += `${minutes % 60}m `;
        }
        timeString += `${seconds % 60}s`;

        setTimeElapsed(timeString);
      }, 1000); // Update every minute

      // Initial calculation
      const now = Date.now();
      const created = task.id;
      const diff = now - created;

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeString = '';
      if (days > 0) {
        timeString += `${days}d `;
      }
      if (hours > 0) {
        timeString += `${hours % 24}h `;
      }
      if (minutes > 0) {
        timeString += `${minutes % 60}m `;
      }
      timeString += `${seconds % 60}s`;
      setTimeElapsed(timeString);

      return () => clearInterval(interval);
    }
  }, [task.id, isCompleted]);

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };

  const handleUncompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUncomplete(task.id);
  };

  return (
    <li
      className={`task-card ${isCompleted ? 'completed-card' : ''}`}
      onClick={!isCompleted ? () => onEdit(task.id) : undefined}
    >
      <div className="card-header">
        <h3>{task.title}</h3>
      </div>
      <div className="card-body">
        <p>{task.body}</p>
      </div>
      <div className="card-footer">
        {!isCompleted && <span className="timer">{timeElapsed}</span>}
        {isCompleted ? (
          <button className="uncomplete-button" onClick={handleUncompleteClick}>
            Uncomplete
          </button>
        ) : (
          <button className="complete-button" onClick={handleCompleteClick}>
            Complete
          </button>
        )}
      </div>
    </li>
  );
};

export default TaskCard;