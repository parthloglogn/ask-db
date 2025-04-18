'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bot, Plus, Search, AlertCircle, Check, X, Loader2, ChevronRight } from 'lucide-react';
import NewAgentModal from './NewAgentModal';

interface Agent {
  id: string;
  agent_name: string;
  is_active: boolean;
  project: {
    id: string;
    project_name: string;
  };
  credential: {
    id: string;
    type: 'telegram' | 'email';
    data: any;
  };
  modified_ts: string;
}

export default function AgentPanel() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/agent`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }

        const data = await response.json();
        setAgents(data || []);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [session]);

  const filteredAgents = agents.filter(agent =>
    agent.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.project?.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).map(agent => ({
    ...agent,
    lastUpdated: new Date(agent.modified_ts).toLocaleDateString(),
  }));

  const handleToggleActive = async (agentId: string, isActive: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/agent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agentId,
          is_active: !isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }

      const updatedAgent = await response.json();
      
      setAgents(agents.map(agent => 
        agent.id === updatedAgent.id ? updatedAgent : agent
      ));
    } catch (err) {
      console.error('Error updating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/agent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agentId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      setAgents(agents.filter(agent => agent.id !== agentId));
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setIsLoading(false);
    }
  };

  const statusStyles = {
    active: { bg: 'bg-green-900/30', text: 'text-green-400', icon: <Check className="w-4 h-4" /> },
    inactive: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', icon: <X className="w-4 h-4" /> },
    error: { bg: 'bg-red-900/30', text: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> }
  };

  return (
    <div className="p-6 h-full bg-gray-900">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Bot className="w-6 h-6" />
          Agents
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
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
            New Agent
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

      {/* Agents List */}
      {!isLoading && (
        <>
          {filteredAgents.length > 0 ? (
            <div className="rounded-lg shadow overflow-hidden bg-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  {/* Table Headers */}
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credential Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-700">
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {agent.agent_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {agent.project?.project_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {agent.credential?.type === 'telegram' ? 'Telegram Bot' : 'Email'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              agent.is_active ? statusStyles.active : statusStyles.inactive
                            }`}
                          >
                            {agent.is_active ? statusStyles.active.icon : statusStyles.inactive.icon}
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => handleToggleActive(agent.id, agent.is_active)}
                            className={`mr-3 ${
                              agent.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                            }`}
                          >
                            {agent.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleDelete(agent.id)}
                            className="text-red-400 hover:text-red-300"
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
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-gray-800/50 text-gray-300">
              <Bot className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-xl mb-2">No Agents Found</p>
              <p className="mb-4">Get started by creating a new agent</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-5 h-5" />
                Create New Agent
              </button>
            </div>
          )}
        </>
      )}

      <NewAgentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={session?.user?.email || ''}
        onAgentCreated={(newAgent) => {
          setAgents([...agents, newAgent]);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}