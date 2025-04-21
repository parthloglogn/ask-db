// app/api/db-connection/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/databaseConnectors';

export async function POST(req: NextRequest) {
  try {
    const { db_type, db_config } = await req.json();
    
    // Validate input
    if (!db_type || !db_config) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Test the connection
    const connection = await connectToDatabase(db_type, db_config);
    
    if (connection.error) {
      return NextResponse.json(
        { success: false, message: connection.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Connection successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Connection failed' },
      { status: 500 }
    );
  }
}