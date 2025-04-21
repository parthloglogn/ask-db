// utils/databaseConnectors.ts
import { DatabaseType } from './databaseTypes';
import { MongoClient } from 'mongodb';
import { Client } from 'pg';
import mysql from 'mysql2/promise';
import { createClient } from 'redis';
import { InfluxDB } from '@influxdata/influxdb-client';
import admin from 'firebase-admin';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const connectToDatabase = async (dbType: DatabaseType, config: any) => {
  try {
    switch (dbType) {
      case 'postgresql':
      case 'cockroachdb':
      case 'timescaledb':
        const pgClient = new Client({
          host: config.host,
          port: parseInt(config.port),
          database: config.dbname,
          user: config.user,
          password: config.password,
          ...(dbType === 'cockroachdb' && { ssl: config.sslmode !== 'disable' })
        });
        await pgClient.connect();
        await pgClient.end();
        return { success: true };

      case 'mysql':
        const mysqlConn = await mysql.createConnection({
          host: config.host,
          port: parseInt(config.port),
          database: config.dbname,
          user: config.user,
          password: config.password
        });
        await mysqlConn.end();
        return { success: true };

      case 'mongodb':
        const mongoUri = `mongodb://${config.user ? `${config.user}:${config.password}@` : ''}${config.host}:${config.port}`;
        const mongoClient = await MongoClient.connect(mongoUri);
        await mongoClient.close();
        return { success: true };

      case 'redis':
        const redisClient = createClient({
          url: `redis://${config.host}:${config.port}`,
          ...(config.password && { password: config.password })
        });
        await redisClient.connect();
        await redisClient.quit();
        return { success: true };

      case 'firestore':
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(config.serviceAccountKey))
        });
        return { success: true };

      case 'dynamodb':
        new DynamoDBClient({
          region: config.region,
          credentials: config.accessKeyId ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          } : undefined
        });
        return { success: true };

      case 'sqlite':
        // SQLite doesn't need connection testing
        return { success: true };

      default:
        return { error: `Unsupported database type: ${dbType}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Connection failed' };
  }
};