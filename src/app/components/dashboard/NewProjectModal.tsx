'use client';

import { useState } from 'react';
import { Database, X, TestTube2, ChevronDown, ChevronUp, Check, CheckCircle } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface TableInfo {
  name: string;
  columns: string[];
}

interface TableRelationships {
  [tableName: string]: {
    [columnName: string]: {
      references: string;
    };
  };
}

export default function NewProjectModal({ isOpen, onClose, userId }: NewProjectModalProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    dbname: '',
    user: '',
    password: '',
    host: 'localhost',
    port: '5432'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<Record<string, string[]>>({});
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableRelationships, setTableRelationships] = useState<TableRelationships>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTables([]);
    setSelectedTables({});
    
    try {
      // First test the connection
      const testResponse = await fetch('/api/db-connection/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db_config: {
            dbname: formData.dbname,
            user: formData.user,
            password: formData.password,
            host: formData.host,
            port: formData.port
          }
        })
      });

      const testResult = await testResponse.json();
      
      if (!testResponse.ok) {
        throw new Error(testResult.message || 'Connection failed');
      }

      // If connection successful, fetch tables and columns
      const schemaResponse = await fetch('/api/db-connection/get-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db_config: {
            dbname: formData.dbname,
            user: formData.user,
            password: formData.password,
            host: formData.host,
            port: formData.port
          }
        })
      });

      const schemaData = await schemaResponse.json();
      
      if (!schemaResponse.ok) {
        throw new Error(schemaData.message || 'Failed to fetch schema');
      }

      setTables(schemaData.tables || []);
      setTableRelationships(schemaData.relationships || {});

      setTestResult({
        success: true,
        message: 'Connection successful! Database schema loaded.'
      });
    } catch (error) {
      console.error('Error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const toggleTableExpand = (tableName: string) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
  };

  const toggleColumnSelection = (tableName: string, columnName: string) => {
    setSelectedTables(prev => {
      const newSelection = { ...prev };
      if (!newSelection[tableName]) {
        newSelection[tableName] = [];
      }
      
      const columnIndex = newSelection[tableName].indexOf(columnName);
      if (columnIndex > -1) {
        // Remove column if already selected
        newSelection[tableName].splice(columnIndex, 1);
        if (newSelection[tableName].length === 0) {
          delete newSelection[tableName];
        }
      } else {
        // Add column if not selected
        newSelection[tableName].push(columnName);
      }
      
      return newSelection;
    });
  };

  const toggleAllColumns = (tableName: string, columns: string[]) => {
    setSelectedTables(prev => {
      const newSelection = { ...prev };
      if (newSelection[tableName] && newSelection[tableName].length === columns.length) {
        // All columns already selected, so deselect all
        delete newSelection[tableName];
      } else {
        // Select all columns
        newSelection[tableName] = [...columns];
      }
      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the selected_tables data structure
      const selectedTablesData = Object.keys(selectedTables).reduce((acc, tableName) => {
        acc[tableName] = selectedTables[tableName];
        return acc;
      }, {} as Record<string, string[]>);

      const response = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: formData.projectName,
          db_credential: {
            dbname: formData.dbname,
            user: formData.user,
            password: formData.password,
            host: formData.host,
            port: formData.port
          },
          selected_tables: selectedTablesData,
          table_relationships: tableRelationships,
          user_id: userId,
          created_by: userId,
          connectionTestSuccessful: testResult?.success ?? false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Project creation failed:', result);
        throw new Error(result?.message || 'Failed to create project');
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error creating project:', error);
      setTestResult({
        success: false,
        message: 'Failed to create project'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 p-4 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            New PostgreSQL Project
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                required
              />
            </div>

            {/* Database Connection Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  name="dbname"
                  value={formData.dbname}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-md ${testResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <p>{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Tables Selection (only shown if connection successful) */}
          {testResult?.success && tables.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-3">Select Tables and Columns</h3>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {tables.map(table => (
                  <div key={table.name} className="bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-600"
                      onClick={() => toggleTableExpand(table.name)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedTables[table.name] && selectedTables[table.name].length === table.columns.length}
                          onChange={() => toggleAllColumns(table.name, table.columns)}
                          onClick={e => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-white">{table.name}</span>
                      </div>
                      {expandedTable === table.name ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {expandedTable === table.name && (
                      <div className="p-3 bg-gray-800 border-t border-gray-600">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {table.columns.map(column => (
                            <div key={`${table.name}-${column}`} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`${table.name}-${column}`}
                                checked={!!selectedTables[table.name]?.includes(column)}
                                onChange={() => toggleColumnSelection(table.name, column)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor={`${table.name}-${column}`} className="text-sm text-gray-300">
                                {column}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={testConnection}
              disabled={isTesting || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md disabled:opacity-50"
            >
              <TestTube2 className="w-4 h-4" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !testResult?.success || Object.keys(selectedTables).length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}