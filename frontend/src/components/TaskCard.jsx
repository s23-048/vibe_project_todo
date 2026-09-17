import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, AlertTriangle } from 'lucide-react';

const PRIORITY_STYLES = {
  high: 'bg-red-500/15 text-red-400 border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const TaskCard = ({ task, index, onClick, members }) => {
  const assignee = task.assignedTo;
  const memberInfo = members?.find((m) => m.userId === assignee?.id);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`rounded-xl p-3.5 mb-2.5 cursor-pointer transition-all duration-150 border ${
            snapshot.isDragging
              ? 'bg-slate-800 border-brand-500/40 shadow-xl shadow-brand-500/10 scale-[1.02]'
              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          {/* Priority + Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-semibold text-slate-200 leading-snug flex-1 line-clamp-2">
              {task.title}
            </h4>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${
                PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
              }`}
            >
              {task.priority}
            </span>
          </div>

          {/* Footer row: due date + assignee */}
          <div className="flex items-center justify-between mt-2.5 gap-2">
            {task.dueDate ? (
              <span
                className={`flex items-center gap-1 text-[10px] ${
                  isOverdue ? 'text-red-400' : 'text-slate-500'
                }`}
              >
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            ) : (
              <span />
            )}

            {assignee ? (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${
                  memberInfo?.isOverloaded
                    ? 'avatar-overloaded bg-red-600'
                    : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
                }`}
                title={`${assignee.name}${memberInfo?.isOverloaded ? ' (Overloaded!)' : ''}`}
              >
                {getInitials(assignee.name)}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center text-[9px] text-slate-600">
                ?
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
