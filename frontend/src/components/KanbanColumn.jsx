import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const COLUMN_CONFIG = {
  todo: { label: 'To-Do', dotColor: 'bg-slate-400', borderColor: 'border-slate-700/50' },
  in_progress: { label: 'In Progress', dotColor: 'bg-amber-400', borderColor: 'border-amber-500/30' },
  done: { label: 'Done', dotColor: 'bg-emerald-400', borderColor: 'border-emerald-500/30' },
};

const KanbanColumn = ({ status, tasks, onTaskClick, members }) => {
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex flex-col flex-1 min-w-[280px]">
      {/* Column Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 bg-slate-900/60 border ${config.borderColor}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className="text-xs font-semibold text-slate-200">{config.label}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`kanban-column flex-1 rounded-xl p-2 transition-colors duration-200 ${
              snapshot.isDraggingOver
                ? 'bg-brand-500/5 border border-dashed border-brand-500/30'
                : 'bg-slate-900/20 border border-transparent'
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
                members={members}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-center text-[10px] text-slate-600 py-8">
                Drop tasks here
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
