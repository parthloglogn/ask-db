// utils/databaseHelpers.ts
import { DatabaseType } from './databaseTypes';

export const getSuccessMessage = (dbType: DatabaseType): string => {
  const messages: Record<DatabaseType, string> = {
    postgresql: 'Connection successful! Database schema loaded.',
    mysql: 'Connection successful! Database schema loaded.',
    sqlite: 'SQLite database loaded successfully!',
    mongodb: 'Connection successful! MongoDB collections available.',
    redis: 'Connection to Redis successful!',
    cassandra: 'Connection to Cassandra successful!',
    neo4j: 'Connection to Neo4j successful!',
    cockroachdb: 'Connection successful! Database schema loaded.',
    influxdb: 'Connection to InfluxDB successful!',
    timescaledb: 'Connection successful! Database schema loaded.',
    firestore: 'Firestore connection successful!',
    dynamodb: 'DynamoDB connection successful!'
  };
  return messages[dbType];
};

export const getDbConfigForApi = (dbType: DatabaseType, formData: any) => {
  const baseConfig = {
    host: formData.host,
    port: formData.port
  };

  switch (dbType) {
    case 'postgresql':
    case 'mysql':
    case 'timescaledb':
      return {
        ...baseConfig,
        dbname: formData.dbname,
        user: formData.user,
        password: formData.password
      };
    case 'cockroachdb':
      return {
        ...baseConfig,
        dbname: formData.dbname,
        user: formData.user,
        password: formData.password,
        sslmode: formData.sslmode
      };
    case 'mongodb':
      return {
        ...baseConfig,
        dbname: formData.dbname,
        ...(formData.user && { user: formData.user }),
        ...(formData.password && { password: formData.password })
      };
    case 'redis':
      return {
        ...baseConfig,
        ...(formData.password && { password: formData.password })
      };
    case 'sqlite':
      return {
        dbname: formData.dbname
      };
    case 'firestore':
      return {
        serviceAccountKey: formData.serviceAccountKey
      };
    case 'dynamodb':
      return {
        region: formData.region,
        ...(formData.accessKeyId && { accessKeyId: formData.accessKeyId }),
        ...(formData.secretAccessKey && { secretAccessKey: formData.secretAccessKey })
      };
    default:
      return baseConfig;
  }
};