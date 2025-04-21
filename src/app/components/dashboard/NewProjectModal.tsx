// components/NewProjectModal.tsx
'use client';

import { useState } from 'react';
import { Database, X, TestTube2, ChevronDown, ChevronUp, CheckCircle, ArrowLeft } from 'lucide-react';
import { DATABASE_TYPES, DatabaseType, databaseSupportsSchema } from '@/utils/databaseTypes';
import Image from 'next/image';

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
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    dbname: '',
    user: '',
    password: '',
    host: 'localhost',
    port: '',
    sslmode: 'require',
    serviceAccountKey: '',
    region: 'us-west-2',
    accessKeyId: '',
    secretAccessKey: ''
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<Record<string, string[]>>({});
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableRelationships, setTableRelationships] = useState<TableRelationships>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectDatabase = (dbType: DatabaseType) => {
    const dbMeta = DATABASE_TYPES.find(db => db.id === dbType);
    if (dbMeta) {
      setSelectedDbType(dbType);
      setFormData(prev => ({
        ...prev,
        port: dbMeta.defaultPort
      }));
      setStep('configure');
    }
  };

  const toggleTableExpand = (tableName: string) => {
    setExpandedTable(current => current === tableName ? null : tableName);
  };

  const toggleAllColumns = (tableName: string, columns: string[]) => {
    setSelectedTables(prev => {
      const isTableSelected = !!prev[tableName] && prev[tableName].length === columns.length;
      return {
        ...prev,
        [tableName]: isTableSelected ? [] : [...columns]
      };
    });
  };

  const toggleColumnSelection = (tableName: string, columnName: string) => {
    setSelectedTables(prev => {
      const tableColumns = prev[tableName] || [];
      const isColumnSelected = tableColumns.includes(columnName);
      
      const updatedColumns = isColumnSelected
        ? tableColumns.filter(col => col !== columnName)
        : [...tableColumns, columnName];
      
      return {
        ...prev,
        [tableName]: updatedColumns
      };
    });
  };

  const testConnection = async () => {
    if (!selectedDbType) return;
    
    setIsTesting(true);
    setTestResult(null);
    setTables([]);
    setSelectedTables({});
    
    try {
      const testResponse = await fetch('/api/db-connection/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: selectedDbType,
          db_config: getDbConfig(selectedDbType, formData)
        })
      });

      const testResult = await testResponse.json();
      
      if (!testResponse.ok) throw new Error(testResult.message || 'Connection failed');

      if (databaseSupportsSchema(selectedDbType)) {
        const schemaResponse = await fetch('/api/db-connection/get-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            db_type: selectedDbType,
            db_config: getDbConfig(selectedDbType, formData)
          })
        });

        const schemaData = await schemaResponse.json();
        if (!schemaResponse.ok) throw new Error(schemaData.message || 'Failed to fetch schema');

        setTables(schemaData.tables || []);
        setTableRelationships(schemaData.relationships || {});
      }

      setTestResult({
        success: true,
        message: getSuccessMessage(selectedDbType)
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getDbConfig = (dbType: DatabaseType, data: typeof formData) => {
    const baseConfig = {
      host: data.host,
      port: data.port
    };

    switch (dbType) {
      case 'postgresql':
      case 'mysql':
        return {
          ...baseConfig,
          dbname: data.dbname,
          user: data.user,
          password: data.password
        };
      case 'cockroachdb':
        return {
          ...baseConfig,
          dbname: data.dbname,
          user: data.user,
          password: data.password,
          sslmode: data.sslmode
        };
      case 'mongodb':
        return {
          ...baseConfig,
          dbname: data.dbname,
          ...(data.user && { user: data.user }),
          ...(data.password && { password: data.password })
        };
      case 'redis':
        return {
          ...baseConfig,
          ...(data.password && { password: data.password })
        };
      case 'sqlite':
        return {
          dbname: data.dbname
        };
      case 'firestore':
        return {
          serviceAccountKey: data.serviceAccountKey
        };
      case 'dynamodb':
        return {
          region: data.region,
          ...(data.accessKeyId && { accessKeyId: data.accessKeyId }),
          ...(data.secretAccessKey && { secretAccessKey: data.secretAccessKey })
        };
      default:
        return baseConfig;
    }
  };

  const getSuccessMessage = (dbType: DatabaseType): string => {
    const dbMeta = DATABASE_TYPES.find(db => db.id === dbType);
    return dbMeta ? `Successfully connected to ${dbMeta.name}!` : 'Connection successful!';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDbType) return;
    
    setIsSubmitting(true);

    try {
      const selectedTablesData = Object.keys(selectedTables).reduce((acc, tableName) => {
        acc[tableName] = selectedTables[tableName];
        return acc;
      }, {} as Record<string, string[]>);

      const response = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: formData.projectName,
          db_type: selectedDbType,
          db_credential: getDbConfig(selectedDbType, formData),
          selected_tables: databaseSupportsSchema(selectedDbType) ? selectedTablesData : undefined,
          table_relationships: databaseSupportsSchema(selectedDbType) ? tableRelationships : undefined,
          user_id: userId,
          created_by: userId,
          connectionTestSuccessful: testResult?.success ?? false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to create project');
      }

      onClose();
      window.location.reload();
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create project'
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
          <div className="flex items-center gap-2">
            {step === 'configure' && (
              <button 
                onClick={() => setStep('select')}
                className="text-gray-400 hover:text-white mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              {step === 'select' ? 'Select Database' : `Configure ${selectedDbType}`}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'select' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DATABASE_TYPES.map((db) => (
                <div
                  key={db.id}
                  onClick={() => selectDatabase(db.id)}
                  className={`${db.color} p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity flex flex-col items-center`}
                >
                  <div className="bg-white p-3 rounded-full mb-3">
                    <Image 
                      src={db.logo} 
                      alt={db.name} 
                      width={40} 
                      height={40} 
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{db.name}</h3>
                  <p className="text-white/80 text-sm text-center mt-1">{db.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
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
              {selectedDbType !== 'firestore' && selectedDbType !== 'sqlite' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDbType !== 'redis' && selectedDbType !== 'dynamodb' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {selectedDbType === 'mongodb' ? 'Database Name' : 'Database Name'}
                      </label>
                      <input
                        type="text"
                        name="dbname"
                        value={formData.dbname}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                        required={(selectedDbType as DatabaseType) !== 'redis'}
                      />
                    </div>
                  )}

                  {(selectedDbType !== 'redis' && selectedDbType !== 'dynamodb') && (
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
                        required={(selectedDbType as DatabaseType) !== 'redis'}
                      />
                    </div>
                  )}

                  {(selectedDbType !== 'redis' && selectedDbType !== 'dynamodb') && (
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
                        required={(selectedDbType as DatabaseType) !== 'redis'}
                      />
                    </div>
                  )}

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
                      required={(selectedDbType as DatabaseType) !== 'sqlite'}
                    />
                  </div>

                  {(selectedDbType as DatabaseType) !== 'sqlite' && (
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
                        required={(selectedDbType as DatabaseType) !== 'sqlite'}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Database-specific fields */}
              {selectedDbType === 'cockroachdb' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    SSL Mode
                  </label>
                  <select
                    name="sslmode"
                    value={formData.sslmode}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="disable">Disable</option>
                    <option value="allow">Allow</option>
                    <option value="prefer">Prefer</option>
                    <option value="require">Require</option>
                    <option value="verify-ca">Verify-CA</option>
                    <option value="verify-full">Verify-Full</option>
                  </select>
                </div>
              )}

              {selectedDbType === 'firestore' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Service Account Key (JSON)
                  </label>
                  <textarea
                    name="serviceAccountKey"
                    value={formData.serviceAccountKey}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white h-32"
                    placeholder="Paste your Firebase service account JSON here"
                    required
                  />
                </div>
              )}

              {selectedDbType === 'dynamodb' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      AWS Region
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Access Key ID (optional)
                      </label>
                      <input
                        type="text"
                        name="accessKeyId"
                        value={formData.accessKeyId}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Secret Access Key (optional)
                      </label>
                      <input
                        type="password"
                        name="secretAccessKey"
                        value={formData.secretAccessKey}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedDbType === 'sqlite' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Database File Path
                  </label>
                  <input
                    type="text"
                    name="dbname"
                    value={formData.dbname}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    placeholder="e.g., /path/to/your/database.db"
                    required
                  />
                </div>
              )}
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

            {/* Tables Selection */}
            {testResult?.success && databaseSupportsSchema(selectedDbType!) && tables.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  {selectedDbType === 'mongodb' ? 'Select Collections and Fields' : 'Select Tables and Columns'}
                </h3>
                
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
                  disabled={isSubmitting || !testResult?.success || 
                    (databaseSupportsSchema(selectedDbType!) && Object.keys(selectedTables).length === 0)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}