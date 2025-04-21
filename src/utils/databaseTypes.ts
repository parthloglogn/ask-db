// utils/databaseTypes.ts
export type DatabaseType = 
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'redis'
  | 'cassandra'
  | 'neo4j'
  | 'cockroachdb'
  | 'influxdb'
  | 'timescaledb'
  | 'firestore'
  | 'dynamodb';

export interface DatabaseMeta {
  id: DatabaseType;
  name: string;
  logo: string;
  description: string;
  color: string;
  defaultPort: string;
}

export const DATABASE_TYPES: DatabaseMeta[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    logo: '/images/postgres.svg',
    description: 'Powerful open-source relational database',
    color: 'bg-blue-800',
    defaultPort: '5432'
  },
  {
    id: 'mysql',
    name: 'MySQL',
    logo: '/images/mysql.png',
    description: 'Popular open-source relational database',
    color: 'bg-orange-500',
    defaultPort: '3306'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    logo: '/images/mongodb.svg',
    description: 'Document-oriented NoSQL database',
    color: 'bg-green-600',
    defaultPort: '27017'
  },
  {
    id: 'redis',
    name: 'Redis',
    logo: '/images/redis.svg',
    description: 'In-memory key-value data store',
    color: 'bg-red-600',
    defaultPort: '6379'
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    logo: '/images/sqlite.png',
    description: 'Lightweight file-based database',
    color: 'bg-blue-400',
    defaultPort: ''
  },
  {
    id: 'cockroachdb',
    name: 'CockroachDB',
    logo: '/images/cockroachdb.png',
    description: 'Distributed SQL database',
    color: 'bg-purple-600',
    defaultPort: '26257'
  },
  {
    id: 'firestore',
    name: 'Firestore',
    logo: '/images/firestore.png',
    description: 'Google Cloud NoSQL document database',
    color: 'bg-yellow-500',
    defaultPort: ''
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    logo: '/images/dynamodb.png',
    description: 'AWS NoSQL key-value database',
    color: 'bg-yellow-700',
    defaultPort: ''
  }
];

export const databaseSupportsSchema = (dbType: DatabaseType): boolean => {
  return [
    'postgresql',
    'mysql',
    'cockroachdb',
    'timescaledb'
  ].includes(dbType);
};