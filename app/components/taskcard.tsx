import React, { useState, useEffect } from 'react';
import '../page.css';

const TaskCard = ({ task, onComplete, onUncomplete, isCompleted, onEdit, onCancelRecurring }: {
  task: { id: number; title: string; body: string; isRecurring?: boolean; checkedUntil?: number; recurrenceDays?: number };
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  isCompleted: boolean;
  onEdit: (id: number) => void;
  onCancelRecurring?: (id: number) => void;
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

  const handleCancelRecurringClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancelRecurring) {
      onCancelRecurring(task.id);
    }
  };

  const isRecurring = task.isRecurring || false;
  const checkedUntil = task.checkedUntil || 0;
  const isCheckedOff = isRecurring && checkedUntil > Date.now();
  const isGrayedOut = isRecurring && isCheckedOff;

  return (
    <li
      className={`task-card ${isCompleted ? 'completed-card' : ''} ${isGrayedOut ? 'recurring-checked-off' : ''} ${isRecurring ? 'recurring-task' : ''}`}
      onClick={!isCompleted ? () => onEdit(task.id) : undefined}
    >
      <div className="card-header">
        <h3>
          {task.title}
          {isRecurring && <span className="recurring-badge">🔄 Recurring</span>}
        </h3>
      </div>
      <div className="card-body">
        <p>{task.body}</p>
        {isRecurring && isCheckedOff && (
          <p className="checked-off-message">
            Checked off until {new Date(checkedUntil).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="card-footer">
        {!isCompleted && !isCheckedOff && <span className="timer">{timeElapsed}</span>}
        {isCompleted ? (
          <button className="uncomplete-button" onClick={handleUncompleteClick}>
            Uncomplete
          </button>
        ) : isRecurring ? (
          <div className="recurring-task-actions">
            {!isCheckedOff && (
              <button className="check-off-button" onClick={handleCompleteClick}>
                Check Off
              </button>
            )}
            {onCancelRecurring && (
              <button className="cancel-recurring-button" onClick={handleCancelRecurringClick}>
                Cancel Recurring
              </button>
            )}
          </div>
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