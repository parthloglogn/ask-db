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
    await client.query('SELECT 1');
    await client.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Connection successful!' 
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      },
      { status: 400 }
    );
  }
}