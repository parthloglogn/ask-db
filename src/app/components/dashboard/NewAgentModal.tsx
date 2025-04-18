'use client';

import { useState, useEffect } from 'react';
import { Bot, Mail, X, Loader2, ChevronRight, Check } from 'lucide-react';

interface NewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onAgentCreated: (agent: any) => void;
}

interface Project {
  id: string;
  project_name: string;
}

interface Credential {
  id: string;
  type: 'telegram' | 'email';
  data: any;
}

export default function NewAgentModal({ isOpen, onClose, userId, onAgentCreated }: NewAgentModalProps) {
  const [step, setStep] = useState<'select' | 'form'>( 'select');
  const [agentName, setAgentName] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setAgentName('');
      setSelectedProject(null);
      setSelectedCredential(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch projects
        const projectsRes = await fetch(`/api/project?email=${userId}`);
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
        
        // Fetch credentials
        const credentialsRes = await fetch(`/api/credentials`);
        if (!credentialsRes.ok) throw new Error('Failed to fetch credentials');
        const credentialsData = await credentialsRes.json();
        setCredentials(credentialsData.map((cred: any) => ({
          id: cred.id,
          type: cred.credentials.botToken ? 'telegram' : 'email',
          data: cred.credentials
        })));
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, userId]);

  const handleSubmit = async () => {
    if (!agentName || !selectedProject || !selectedCredential) {
      setError('Please fill all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_name: agentName,
          project_id: selectedProject.id,
          credential_id: selectedCredential.id
        }),
      });

      if (!response.ok) throw new Error('Failed to create agent');

      const newAgent = await response.json();
      onAgentCreated(newAgent);
      onClose();
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 'select' ? 'Select Project & Credential' : 'Create New Agent'}
          </h2>
          <button 
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'select' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Select Project</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedProject?.id === project.id 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{project.project_name}</span>
                        {selectedProject?.id === project.id && (
                          <Check className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 py-2">No projects available</div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Select Credential</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : credentials.length > 0 ? (
                <div className="space-y-2">
                  {credentials.map((credential) => (
                    <div 
                      key={credential.id}
                      onClick={() => setSelectedCredential(credential)}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedCredential?.id === credential.id 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {credential.type === 'telegram' ? (
                            <Bot className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Mail className="w-5 h-5 text-green-400" />
                          )}
                          <span>
                            {credential.type === 'telegram' 
                              ? 'Telegram Bot' 
                              : `Email: ${credential.data.email}`}
                          </span>
                        </div>
                        {selectedCredential?.id === credential.id && (
                          <Check className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 py-2">No credentials available</div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedProject || !selectedCredential) {
                    setError('Please select both project and credential');
                    return;
                  }
                  setStep('form');
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Agent Name</label>
              <input
                type="text"
                placeholder="Enter agent name"
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Selected Project</h3>
              <div className="p-3 border border-gray-700 rounded-lg bg-gray-700/50">
                {selectedProject?.project_name || 'None selected'}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Selected Credential</h3>
              <div className="p-3 border border-gray-700 rounded-lg bg-gray-700/50 flex items-center gap-2">
                {selectedCredential?.type === 'telegram' ? (
                  <Bot className="w-5 h-5 text-blue-400" />
                ) : (
                  <Mail className="w-5 h-5 text-green-400" />
                )}
                <span>
                  {selectedCredential?.type === 'telegram' 
                    ? 'Telegram Bot' 
                    : `Email: ${selectedCredential?.data.email}`}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}