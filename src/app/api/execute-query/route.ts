import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: Request) {
  try {
    const { query, dbConfig } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!dbConfig) {
      return NextResponse.json({ error: 'Database config is required' }, { status: 400 });
    }

    const client = new Client({
      database: dbConfig.dbname,
      user: dbConfig.user,
      password: dbConfig.password,
      host: dbConfig.host,
      port: dbConfig.port
    });

    await client.connect();
    const result = await client.query(query);
    await client.end();

    return NextResponse.json({
      rows: result.rows,
      fields: result.fields.map((f: { name: any; }) => f.name)
    });
  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute query' },
      { status: 500 }
    );
  }
}