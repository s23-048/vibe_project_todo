import React, { useState } from 'react';
import api from '../api/client';
import { X, Plus, Loader2 } from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, projectId, members, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status: 'todo',
      };
      if (dueDate) payload.dueDate = dueDate;
      if (assignedToId) payload.assignedToId = assignedToId;

      const res = await api.post(`/projects/${projectId}/tasks`, payload);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignedToId('');
      onTaskCreated(res.data.task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">New Task</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 rounded-xl glass-input text-sm placeholder-slate-500"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-desc" className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              className="w-full px-3 py-2 rounded-xl glass-input text-sm placeholder-slate-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-select text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-due" className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-assignee" className="block text-xs font-medium text-slate-300 mb-1">Assignee</label>
            <select
              id="task-assignee"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-select text-sm"
            >
              <option value="">Unassigned</option>
              {members?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name} ({m.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
