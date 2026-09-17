import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import CreateProjectModal from '../components/CreateProjectModal';
import {
  FolderKanban,
  Plus,
  Users,
  CheckSquare,
  Shield,
  Search,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Could not load your projects. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = (newProject) => {
    // Add new project to state with myRole = 'owner'
    setProjects((prev) => [
      {
        ...newProject,
        myRole: 'owner',
        _count: {
          members: 1,
          tasks: 0,
        },
      },
      ...prev,
    ]);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                My Projects
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {projects.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Manage your workflows, collaborate with team members, and track progress
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="new-project-button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all duration-200 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {projects.length > 0 && (
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-projects-input"
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs placeholder-slate-500 focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="mt-3 text-xs text-slate-400">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="mt-12 py-16 px-4 rounded-3xl glass-panel border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-inner">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No projects yet</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Create your first project to start organizing tasks, managing member workloads, and collaborating.
            </p>
            <button
              id="empty-create-project-button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* No search results */
          <div className="mt-12 py-12 text-center">
            <p className="text-xs text-slate-400">No projects matching "{searchTerm}"</p>
          </div>
        ) : (
          /* Projects Grid */
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const isOwner = project.myRole === 'owner';
              return (
                <div
                  key={project.id}
                  id={`project-card-${project.id}`}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group glass-card rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-brand-500/10 relative flex flex-col justify-between"
                >
                  <div>
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          isOwner
                            ? 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {isOwner ? 'Owner' : 'Member'}
                      </span>

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[11px]" title="Members">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{project._count?.members ?? 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]" title="Tasks">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>{project._count?.tasks ?? 0}</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                      Open Board →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectList;
