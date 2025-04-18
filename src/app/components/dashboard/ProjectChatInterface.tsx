// components/ProjectChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Database, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isQuery?: boolean;
}

interface ProjectChatInterfaceProps {
  project: {
    id: string;
    project_name: string;
    db_credential: {
      dbname: string;
      user: string;
      password: string;
      host: string;
      port: string;
    };
    selected_tables?: Record<string, string[]>; // From stored JSON
    table_relationships?: Record<string, Record<string, { references: string }>>; // From stored JSON
  };
  onClose: () => void;
}

export default function ProjectChatInterface({ project, onClose }: ProjectChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 const handleSendMessage = async () => {
  if (!inputValue.trim()) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputValue,
    isUser: true
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsLoading(true);

  try {
    const queryResponse = await fetch('/api/generate-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: inputValue,
        dbSchema: {
          tables: project.selected_tables || {},
          relationships: project.table_relationships || {}
        }
      })
    });

    const queryJson = await queryResponse.json();

    if (!queryResponse.ok) {
      throw new Error(queryJson.error || 'Failed to generate query');
    }

    const { query } = queryJson;

    setMessages(prev => [
      ...prev,
      {
        id: `query-${Date.now()}`,
        content: query,
        isUser: false,
        isQuery: true
      }
    ]);

    const executeResponse = await fetch('/api/execute-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        dbConfig: project.db_credential
      })
    });

    const executeJson = await executeResponse.json();

    if (!executeResponse.ok) {
      throw new Error(executeJson.error || 'Failed to execute query');
    }

    setMessages(prev => [
      ...prev,
      {
        id: `result-${Date.now()}`,
        content: formatQueryResult(executeJson),
        isUser: false
      }
    ]);
  } catch (error) {
    setMessages(prev => [
      ...prev,
      {
        id: `error-${Date.now()}`,
        content: `❌ Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        isUser: false
      }
    ]);
  } finally {
    setIsLoading(false);
  }
};


  const formatQueryResult = (result: any) => {
    if (!result || !result.rows) return 'No results found';
    
    if (result.rows.length === 0) {
      return 'Query executed successfully but returned no results';
    }

    // Format as a simple table
    const headers = result.fields?.map((f: any) => f.name).join(' | ') || 
                    Object.keys(result.rows[0]).join(' | ');
    const separator = '-'.repeat(headers.length);
    const rows = result.rows.map((row: any) => 
      Object.values(row).join(' | ')
    ).join('\n');

    return `${headers}\n${separator}\n${rows}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            {project.project_name} - SQL Assistant
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div 
              key={message.id}
              className={`p-3 rounded-lg ${message.isUser ? 'bg-blue-900/30 ml-auto max-w-[80%]' : 'bg-gray-700 mr-auto max-w-[80%]'}`}
            >
              {message.isQuery && (
                <div className="text-xs text-gray-400 mb-1">Generated SQL:</div>
              )}
              <div className={`whitespace-pre-wrap ${message.isQuery ? 'font-mono text-sm' : ''}`}>
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center p-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your data..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}