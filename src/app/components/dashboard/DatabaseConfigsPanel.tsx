'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Database, Plus, Search, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import NewProjectModal from './NewProjectModal';
import ProjectChatInterface from './ProjectChatInterface';

interface Project {
  id: string;
  project_name: string;
  db_credential: {
    dbname: string;
    user: string;
    host: string;
    port: string;
  };
  modified_ts: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export default function DatabaseConfigsPanel() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState<{
  id: string;
  project_name: string;
  db_credential: any;
  selected_tables?: any;
  table_relationships?: any;
} | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/project?email=${session.user.email}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [session]);

  const filteredProjects = projects.filter(project =>
    project.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.db_credential?.dbname?.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(project => ({
    ...project,
    lastUpdated: new Date(project.modified_ts).toLocaleDateString(),
    databaseType: 'PostgreSQL' // Default type since it's not in your model
  }));

  const handleProjectClick = (project: any) => {
  // Fetch the full project details including stored JSON
  fetch(`/api/project/${project.id}`)
    .then(res => res.json())
    .then(data => setSelectedProject(data))
    .catch(err => console.error('Error fetching project details:', err));
};

  const statusStyles = {
    connected: { bg: 'bg-green-900/30', text: 'text-green-400', icon: <Check className="w-4 h-4" /> },
    disconnected: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', icon: <X className="w-4 h-4" /> },
    error: { bg: 'bg-red-900/30', text: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> }
  };

  return (
    <div className="p-6 h-full bg-gray-900">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Database className="w-6 h-6" />
          Projects
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-800 border-gray-700 focus:ring-blue-500 text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Projects List */}
      {!isLoading && (
        <>
          {filteredProjects.length > 0 ? (
            <div className="rounded-lg shadow overflow-hidden bg-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  {/* Table Headers */}
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Database</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-700">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} 
                      onClick={() => handleProjectClick(project)}
                      className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {project.project_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {project.db_credential?.dbname || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {project.lastUpdated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusStyles[project.connectionStatus].bg} ${statusStyles[project.connectionStatus].text}`}>
                            {statusStyles[project.connectionStatus].icon}
                            {project.connectionStatus.charAt(0).toUpperCase() + project.connectionStatus.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-400 hover:text-blue-300 mr-3">Edit</button>
                          <button className="text-red-400 hover:text-red-300">Delete</button>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-gray-800/50 text-gray-300">
              <Database className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-xl mb-2">No Projects Found</p>
              <p className="mb-4">Get started by creating a new project</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-5 h-5" />
                Create New Project
              </button>
            </div>
          )}
        </>
      )}

      

      <NewProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={session?.user?.email || ''}
      />

      {selectedProject && (
  <ProjectChatInterface 
    project={selectedProject}
    onClose={() => setSelectedProject(null)}
  />
)}
    </div>
    
  );
}