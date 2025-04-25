'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Database, Plus, Search, AlertCircle, Check, X, Loader2, RefreshCw, Grid, List } from 'lucide-react';
import NewProjectModal from './NewProjectModal';
import ProjectChatInterface from './ProjectChatInterface';
import { getDatabaseLogo } from '@/utils/getDatabaseMeta';
import { DatabaseType } from '@/utils/databaseTypes';

interface Project {
  id: string;
  project_name: string;
  db_credential: {
    dbname: string;
    user: string;
    host: string;
    port: string;
    type?: string; 
  };
  modified_ts: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'checking';
}

export default function DatabaseConfigsPanel() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    project_name: string;
    db_credential: any;
    selected_tables?: any;
    table_relationships?: any;
  } | null>(null);

 const checkConnectionStatus = async (project: Project) => {
  try {
    const dbType = project.db_credential.type || 'postgresql'; // Default to postgresql if type is not set

    setProjects(prev =>
      prev.map(p => p.id === project.id ? { ...p, connectionStatus: 'checking' } : p)
    );

    const response = await fetch(`/api/db-connection/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        db_type: dbType,
        db_config: project.db_credential
      }),
    });

    const result = await response.json();

    setProjects(prev =>
      prev.map(p => p.id === project.id
        ? { ...p, connectionStatus: result.success ? 'connected' : 'disconnected' }
        : p
      )
    );
  } catch (err) {
    setProjects(prev =>
      prev.map(p => p.id === project.id ? { ...p, connectionStatus: 'error' } : p)
    );
  }
};


  // Check all connections
  const checkAllConnections = async () => {
    setRefreshing(true);
    const promises = projects.map(project => checkConnectionStatus(project));
    await Promise.all(promises);
    setRefreshing(false);
  };

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
        // Initialize projects with "checking" status
        const projectsWithStatus = (data.projects || []).map((project: Project) => ({
          ...project,
          connectionStatus: 'checking'
        }));
        
        setProjects(projectsWithStatus);
        
        // After setting initial projects, check all connections
        setTimeout(() => {
          projectsWithStatus.forEach((project: Project) => {
            checkConnectionStatus(project);
          });
        }, 500);
        
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
    // Determine database type based on credentials or default to PostgreSQL
    databaseType: project.db_credential?.type || 'postgresql'
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
    error: { bg: 'bg-red-900/30', text: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> },
    checking: { bg: 'bg-blue-900/30', text: 'text-blue-400', icon: <Loader2 className="w-4 h-4 animate-spin" /> }
  };

  return (
    <div className="p-6 h-full bg-gray-900 transition-all duration-300">
      {/* Header, Search, and View Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Database className="w-6 h-6" />
          Database Projects
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
          
          <div className="flex gap-2">
            <button 
              onClick={checkAllConnections}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking' : 'Check All'}
            </button>
            
            <div className="flex rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center p-2 ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center p-2 ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 text-red-300 mb-6">
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

      {/* Projects Display */}
      {!isLoading && (
        <>
          {filteredProjects.length > 0 ? (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProjects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700/80 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer border border-gray-700 shadow-lg animate-fadeInUp"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          {getDatabaseLogo(project.databaseType as DatabaseType)}
                        </div>                        
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyles[project.connectionStatus].bg} ${statusStyles[project.connectionStatus].text}`}>
                          {statusStyles[project.connectionStatus].icon}
                          {project.connectionStatus === 'checking' ? 'Checking' : 
                            project.connectionStatus.charAt(0).toUpperCase() + project.connectionStatus.slice(1)}
                        </div>
                      </div>
                      
                      <h3 className="text-white font-medium text-lg mb-1 truncate">{project.project_name}</h3>
                      <div className="text-gray-400 text-sm mb-3 truncate">
                        {project.db_credential?.dbname || 'No database name'}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
                        <span>Updated: {project.lastUpdated}</span>
                        <span className="capitalize">{project.databaseType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* List/Table View */}
              {viewMode === 'list' && (
                <div className="rounded-lg shadow overflow-hidden bg-gray-800">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      {/* Table Headers */}
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Database</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
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
                            className="hover:bg-gray-700/50 cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                  {getDatabaseLogo(project.databaseType as DatabaseType)}
                                </div>
                                <span className="text-sm font-medium text-white">{project.project_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {project.db_credential?.dbname || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                              {project.databaseType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {project.lastUpdated}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusStyles[project.connectionStatus].bg} ${statusStyles[project.connectionStatus].text}`}>
                                {statusStyles[project.connectionStatus].icon}
                                {project.connectionStatus === 'checking' ? 'Checking' : 
                                  project.connectionStatus.charAt(0).toUpperCase() + project.connectionStatus.slice(1)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button 
                                className="text-blue-400 hover:text-blue-300 mr-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit functionality
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="text-red-400 hover:text-red-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete functionality
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
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