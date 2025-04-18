'use client';

import { useState, useEffect } from 'react';
import {LockIcon, Plus, X, Bot, Mail, ChevronRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Credential {
  id: string;
  type: 'telegram' | 'email';
  data: {
    botToken?: string;
    chatId?: string;
    email?: string;
    password?: string;
  };
  updatedAt: string;
}

export default function CredentialsPanel() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedType, setSelectedType] = useState<'telegram' | 'email' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchCredentials = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/credentials`);
        if (!response.ok) throw new Error('Failed to fetch credentials');
        
        const data = await response.json();
        setCredentials(data.map((cred: any) => {
        const type: 'telegram' | 'email' =
          cred.credentials.botToken && cred.credentials.chatId
            ? 'telegram'
            : 'email';
              
        return {
          id: cred.id,
          type,
          data: cred.credentials,
          updatedAt: new Date(cred.modified_ts).toLocaleDateString(),
        };
      }));

      } catch (err) {
        console.error('Error fetching credentials:', err);
        setError(err instanceof Error ? err.message : 'Failed to load credentials');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, [session]);

  const handleSave = async (credential: { type: 'telegram' | 'email'; data: any }) => {
    try {
      if (!session?.user?.email) throw new Error('Not authenticated');
      
      setIsLoading(true);
      setError(null);
    
      
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          credentials: credential.data
        }),
      });

      if (!response.ok) throw new Error('Failed to save credential');

      const newCredential = await response.json();
      
      setCredentials([...credentials, {
        id: newCredential.id,
        type: credential.type,
        data: newCredential.credentials,
        updatedAt: new Date(newCredential.modified_ts).toLocaleDateString()
      }]);
      
      setShowForm(false);
      setSelectedType(null);
    } catch (err) {
      console.error('Error saving credential:', err);
      setError(err instanceof Error ? err.message : 'Failed to save credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!session?.user?.email) throw new Error('Not authenticated');
      
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/credentials', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          id
        }),
      });

      if (!response.ok) throw new Error('Failed to delete credential');

      setCredentials(credentials.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting credential:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete credential');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && credentials.length === 0) {
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
          <LockIcon className="w-6 h-6" />
          Credentials
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
          New Credential
        </button>
      </div>

      {/* Credential Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Credential</h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setSelectedType(null);
                }}
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!selectedType ? (
              <div className="space-y-3">
                <div 
                  onClick={() => setSelectedType('telegram')}
                  className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer"
                >
                  <Bot className="w-6 h-6 text-blue-400" />
                  <span>Telegram Bot</span>
                  <CustomChevronRight className="ml-auto" />
                </div>
                <div 
                  onClick={() => setSelectedType('email')}
                  className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer"
                >
                  <Mail className="w-6 h-6 text-green-400" />
                  <span>Email</span>
                  <CustomChevronRight className="ml-auto" />
                </div>
              </div>
            ) : (
              <CredentialForm 
                type={selectedType} 
                onSave={handleSave}
                onCancel={() => setSelectedType(null)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      )}

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-gray-800/50 text-gray-300">
          <p className="text-xl mb-2">No Credentials Yet</p>
          <p className="mb-4">Add your first credential to get started</p>
        </div>
      ) : (
        <div className="rounded-lg shadow overflow-hidden bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
            <tbody className="divide-y divide-gray-700">
              {credentials.map((cred) => (
                <tr key={cred.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                      {cred.type === 'telegram' ? (
                        <Bot className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Mail className="w-5 h-5 text-green-400" />
                      )}
                      <span>{cred.type === 'telegram' ? 'Telegram Bot' : 'Email'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {cred.type === 'telegram' ? (
                      <span>Bot: {cred.data.botToken}</span>
                    ) : (
                      <span>Email: {cred.data.email}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cred.updatedAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      className="text-blue-400 hover:underline mr-3"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Editing...' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => handleDelete(cred.id)}
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

interface CredentialFormProps {
  type: 'telegram' | 'email';
  onSave: (credential: { type: 'telegram' | 'email'; data: any }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CredentialForm({ type, onSave, onCancel, isLoading }: CredentialFormProps) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      data: formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'telegram' ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Bot Token</label>
            <input
              type="text"
              placeholder="Enter bot token"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={formData.botToken || ''}
              onChange={(e) => setFormData({...formData, botToken: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chat ID</label>
            <input
              type="text"
              placeholder="Enter chat ID"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={formData.chatId || ''}
              onChange={(e) => setFormData({...formData, chatId: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              value={formData.password || ''}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
        </>
      )}

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
          Save Credential
        </button>
      </div>
    </form>
  );
}

function CustomChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}