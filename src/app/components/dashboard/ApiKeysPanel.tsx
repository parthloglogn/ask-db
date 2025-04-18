'use client';

import { useState, useEffect, JSX } from 'react';
import { KeyRound, Plus, X, ChevronRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ApiKey {
  id: string;
  provider: 'openai' | 'deepseek' | 'anthropic' | 'groq';
  apiKey: string;
  updatedAt: string;
}

// Provider logos component
const ProviderLogo = ({ provider, className = '', size = 'w-6 h-6' }: { provider: string; className?: string; size?: string }) => {
  const baseClasses = `rounded-full flex items-center justify-center ${size}`;

  const providers: Record<string, { bg: string; icon: string }> = {
    openai: {
      bg: 'bg-[#ffffff]',
      icon: '/images/openai.svg', 
    },
    deepseek: {
      bg: 'bg-[#2A5CAA]',
      icon: '/images/deepseek.svg', 
    },
    anthropic: {
      bg: 'bg-[#D4A017]',
      icon: '/images/anthropic.svg', 
    },
    groq: {
      bg: 'bg-[#00A67E]',
      icon: '/images/groq.png', 
    }
  };

  return (
    <div className={`${baseClasses} ${providers[provider]?.bg || 'bg-gray-500'} ${className}`}>
      <img src={providers[provider]?.icon || providers.openai.icon} alt={provider} className="w-full h-full object-contain" />
    </div>
  );
};


// Provider selection component
const ProviderSelection = ({ onSelect }: { onSelect: (provider: 'openai' | 'deepseek' | 'anthropic' | 'groq') => void }) => {
  const providers = [
    { id: 'openai', name: 'OpenAI', available: true },
    { id: 'deepseek', name: 'DeepSeek', available: false },
    { id: 'anthropic', name: 'Anthropic', available: false },
    { id: 'groq', name: 'Groq', available: false }
  ];

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <div
          key={provider.id}
          onClick={() => provider.available && onSelect(provider.id as any)}
          className={`flex items-center gap-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer ${
            !provider.available ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <ProviderLogo provider={provider.id} />
          <span>{provider.name}</span>
          {!provider.available ? (
            <span className="ml-auto text-xs text-gray-400">Coming soon</span>
          ) : (
            <ChevronRight className="ml-auto" />
          )}
        </div>
      ))}
    </div>
  );
};

export default function ApiKeyPanel() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'deepseek' | 'anthropic' | 'groq' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchApiKeys = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/apikeys`);
        if (!response.ok) throw new Error('Failed to fetch API keys');
        
        const data = await response.json();
        setApiKeys(data.map((key: any) => ({
          id: key.id,
          provider: key.provider,
          apiKey: key.apiKey,
          updatedAt: new Date(key.modified_ts).toLocaleDateString(),
        })));

      } catch (err) {
        console.error('Error fetching API keys:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API keys');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, [session]);

  const handleSave = async (apiKey: { provider: 'openai' | 'deepseek' | 'anthropic' | 'groq'; apiKey: string }) => {
    try {
      if (!session?.user?.email) throw new Error('Not authenticated');
      
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          provider: apiKey.provider,
          apiKey: apiKey.apiKey
        }),
      });

      if (!response.ok) throw new Error('Failed to save API key');

      const newApiKey = await response.json();
      
      setApiKeys([...apiKeys, {
        id: newApiKey.id,
        provider: apiKey.provider,
        apiKey: apiKey.apiKey,
        updatedAt: new Date(newApiKey.modified_ts).toLocaleDateString()
      }]);
      
      setShowForm(false);
      setSelectedProvider(null);
    } catch (err) {
      console.error('Error saving API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!session?.user?.email) throw new Error('Not authenticated');
      
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/apikeys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          id
        }),
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && apiKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gray-900 text-white">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <KeyRound className="w-6 h-6" />
          API Keys
        </h1>

        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          New API Key
        </button>
      </div>

      {/* API Key Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New API Key</h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setSelectedProvider(null);
                }}
                disabled={isLoading}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!selectedProvider ? (
              <ProviderSelection onSelect={setSelectedProvider} />
            ) : (
              <ApiKeyForm 
                provider={selectedProvider} 
                onSave={handleSave}
                onCancel={() => setSelectedProvider(null)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-gray-800/50 text-gray-300">
          <p className="text-xl mb-2">No API Keys Yet</p>
          <p className="mb-4">Add your first API key to get started</p>
        </div>
      ) : (
        <div className="rounded-lg shadow overflow-hidden bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">API Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <ProviderLogo provider={key.provider} className="w-5 h-5" />
                        <span className="capitalize">{key.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {key.apiKey.substring(0, 5)}...{key.apiKey.substring(key.apiKey.length - 4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{key.updatedAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        className="text-blue-400 hover:underline mr-3"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Editing...' : 'Edit'}
                      </button>
                      <button 
                        onClick={() => handleDelete(key.id)}
                        className="text-red-400 hover:underline"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface ApiKeyFormProps {
  provider: 'openai' | 'deepseek' | 'anthropic' | 'groq';
  onSave: (apiKey: { provider: 'openai' | 'deepseek' | 'anthropic' | 'groq'; apiKey: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ApiKeyForm({ provider, onSave, onCancel, isLoading }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      apiKey
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ProviderLogo provider={provider} />
        <h3 className="font-medium capitalize">{provider} API Key</h3>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">API Key</label>
        <input
          type="text"
          placeholder={`Enter your ${provider} API key`}
          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save API Key
        </button>
      </div>
    </form>
  );
}