import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import KanbanColumn from '../components/KanbanColumn';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import AddMemberControl from '../components/AddMemberControl';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'done'];

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Fetch project detail (includes members with workload + tasks)
  const fetchProject = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      setTasks(res.data.project.tasks || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project');
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchProject();
      setLoading(false);
    };
    load();
  }, [fetchProject]);

  const isOwner = project?.ownerId === user?.id;

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  // DnD handler
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      )
    );

    try {
      await api.patch(`/projects/${id}/tasks/${draggableId}`, { status: newStatus });
      // Refetch to get updated workload counts
      await fetchProject();
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert on failure
      await fetchProject();
    }
  };

  // Callbacks for modals
  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
    // Refetch to update workload
    fetchProject();
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    fetchProject();
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    fetchProject();
  };

  const handleMemberAdded = () => {
    fetchProject();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center glass-panel rounded-2xl p-8 border border-red-500/20 max-w-md">
            <p className="text-red-400 text-sm font-semibold mb-2">Error</p>
            <p className="text-slate-400 text-xs">{error || 'Project not found'}</p>
            <Link to="/projects" className="mt-4 inline-block px-4 py-2 rounded-xl bg-slate-800 text-white text-xs hover:bg-slate-700 transition-colors">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-full mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Top bar: back + project name + actions */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/projects"
              id="back-to-projects-link"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <div className="min-w-0">
              <h1 id="project-detail-name" className="text-lg font-bold text-white truncate">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-[11px] text-slate-500 truncate">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              id="create-task-button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Members bar with workload avatars + add member */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/60 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-2">Team:</span>
            {project.members?.map((member) => (
              <div
                key={member.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white -ml-1 first:ml-0 relative group shrink-0 ${
                  member.isOverloaded
                    ? 'avatar-overloaded bg-red-600'
                    : 'bg-gradient-to-tr from-brand-600 to-indigo-600 border-2 border-slate-950'
                }`}
                title={`${member.user?.name} — ${member.inProgressCount ?? 0} in progress${member.isOverloaded ? ' (OVERLOADED)' : ''}`}
              >
                {getInitials(member.user?.name)}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30">
                  <div className="glass-panel rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap border border-slate-700 shadow-lg">
                    <span className="font-semibold text-white">{member.user?.name}</span>
                    <span className="text-slate-400 ml-1.5">
                      {member.inProgressCount ?? 0} in progress
                    </span>
                    {member.isOverloaded && (
                      <span className="ml-1.5 text-red-400 flex items-center gap-0.5 inline-flex">
                        <AlertTriangle className="w-3 h-3" /> Overloaded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isOwner && (
            <AddMemberControl projectId={id} onMemberAdded={handleMemberAdded} />
          )}
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onTaskClick={(task) => setEditTask(task)}
                members={project.members}
              />
            ))}
          </div>
        </DragDropContext>
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={id}
        members={project.members}
        onTaskCreated={handleTaskCreated}
      />

      <EditTaskModal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
        projectId={id}
        members={project.members}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
};

export default ProjectDetail;
