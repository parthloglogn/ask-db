import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: Request) {
  try {
    const { db_config } = await req.json();
    
    const client = new Client({
      database: db_config.dbname,
      user: db_config.user,
      password: db_config.password,
      host: db_config.host,
      port: parseInt(db_config.port)
    });

    await client.connect();

    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    const tablesRes = await client.query(tablesQuery);

    // Get columns for each table
    const tablesWithColumns = await Promise.all(
      tablesRes.rows.map(async (table) => {
        const columnsQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `;
        const columnsRes = await client.query(columnsQuery, [table.table_name]);
        return {
          name: table.table_name,
          columns: columnsRes.rows.map(row => row.column_name)
        };
      })
    );

    // Get foreign key relationships
    const relationshipsQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `;
    const relationshipsRes = await client.query(relationshipsQuery);

    // Format relationships
    const relationships: Record<string, Record<string, { references: string }>> = {};
    relationshipsRes.rows.forEach(row => {
      if (!relationships[row.table_name]) {
        relationships[row.table_name] = {};
      }
      relationships[row.table_name][row.column_name] = {
        references: `${row.foreign_table_name}.${row.foreign_column_name}`
      };
    });

    await client.end();

    return NextResponse.json({
      tables: tablesWithColumns,
      relationships
    });
  } catch (error) {
    console.error('Schema fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}