import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import {
  ArrowLeft,
  Users,
  Shield,
  Loader2,
  AlertTriangle,
  Kanban,
  CheckCircle2,
} from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/projects/${id}`);
        setProject(response.data.project);
      } catch (err) {
        console.error('Failed to fetch project detail:', err);
        setError(err.response?.data?.error || 'Project could not be found or access is denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/projects"
            id="back-to-projects-link"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="mt-3 text-xs text-slate-400">Loading project details...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto p-6 rounded-2xl glass-panel border border-red-500/20 text-red-400 text-xs">
              <p className="font-semibold text-sm mb-1">Error Loading Project</p>
              <p>{error}</p>
              <button
                onClick={() => navigate('/projects')}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Return to Project List
              </button>
            </div>
          </div>
        ) : project ? (
          <div className="space-y-8">
            {/* Project Header Banner */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 id="project-detail-name" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {project.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      Active
                    </span>
                  </div>
                  <p id="project-detail-desc" className="mt-2 text-sm text-slate-400 max-w-2xl">
                    {project.description || 'No description provided for this project.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-400" />
                    <span>{project.members?.length || 1} Members</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Members Section */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-brand-400" />
                  <h2 className="text-base font-semibold text-white">Project Members</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
                    {project.members?.length || 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="project-members-list">
                {project.members?.map((member) => {
                  const isOwner = member.role === 'owner';
                  return (
                    <div
                      key={member.id}
                      className="glass-card rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                          {member.user?.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={member.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(member.user?.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {member.user?.name || 'Unknown'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            isOwner
                              ? 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {member.role}
                        </span>

                        {/* Workload Indicator */}
                        {typeof member.inProgressCount === 'number' && (
                          <div className="flex items-center gap-1 text-[10px]">
                            {member.isOverloaded ? (
                              <span className="flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" /> Overloaded ({member.inProgressCount})
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                {member.inProgressCount} in progress
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kanban Placeholder Notice */}
            <div className="p-8 rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/30 text-center flex flex-col items-center justify-center">
              <Kanban className="w-10 h-10 text-brand-400/50 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Kanban Board coming in next step</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Task columns (Todo, In Progress, Done) and drag-and-drop workflow will be added in Step 4.
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default ProjectDetail;
