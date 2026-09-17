import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Trash2, Loader2, Save } from 'lucide-react';

const EditTaskModal = ({ isOpen, onClose, task, projectId, members, onTaskUpdated, onTaskDeleted }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAssignedToId(task.assignedToId || '');
      setError('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async (e) => {
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
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate || null,
        assignedToId: assignedToId || null,
      };
      const res = await api.patch(`/projects/${projectId}/tasks/${task.id}`, payload);
      onTaskUpdated(res.data.task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task permanently?')) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      onTaskDeleted(task.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <h3 className="text-base font-semibold text-white">Edit Task</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div>
            <label htmlFor="edit-title" className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-desc" className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="edit-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-status" className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-select text-sm"
              >
                <option value="todo">To-Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-priority" className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-select text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-due" className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                id="edit-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-assignee" className="block text-xs font-medium text-slate-300 mb-1">Assignee</label>
              <select
                id="edit-assignee"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-select text-sm"
              >
                <option value="">Unassigned</option>
                {members?.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
