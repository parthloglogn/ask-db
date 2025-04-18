// app/api/generate-query/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from "next-auth";
import { authConfig } from '../../../lib/auth';
import { prisma } from '@/lib/db';

interface TableSchema {
  [tableName: string]: string[]; // Array of column names
}

interface TableRelationships {
  [tableName: string]: {
    [columnName: string]: {
      references: string;
    };
  };
}

interface RequestBody {
  userInput: string;
  dbSchema: {
    tables?: TableSchema;
    relationships?: TableRelationships;
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's OpenAI API key
    const userWithApiKey = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ApiKey: {  // Note: This should match your Prisma relation name (case-sensitive)
          where: { provider: 'openai' },
          take: 1
        }
      }
    });

     if (!userWithApiKey) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userWithApiKey.ApiKey || userWithApiKey.ApiKey.length === 0) {
      return NextResponse.json(
        { error: 'No OpenAI API key found. Please add your API key first.' },
        { status: 400 }
      );
    }

    const openaiApiKey = userWithApiKey.ApiKey[0].apiKey;
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });


    const { userInput, dbSchema }: RequestBody = await req.json();

    if (!userInput) {
      return NextResponse.json({ error: 'User input is required' }, { status: 400 });
    }

    // Format schema information exactly as in your Python code
    let DB_SCHEMA = "Database Schema:\n";
    if (dbSchema.tables) {
      for (const [table, columns] of Object.entries(dbSchema.tables)) {
        if (Array.isArray(columns)) {
          DB_SCHEMA += `${table} (${columns.join(', ')})\n`;
        }
      }
    }
    DB_SCHEMA += "\nPlease generate SQL queries using **these table names and column names**.\n";

    // Add table relationships exactly as in your Python code
    let relationship_info = "\nTable Relationships:\n";
    if (dbSchema.relationships) {
      for (const [table, relations] of Object.entries(dbSchema.relationships)) {
        if (typeof relations === 'object' && relations !== null) {
          for (const [column, ref] of Object.entries(relations)) {
            if (typeof ref === 'object' && ref !== null && 'references' in ref) {
              relationship_info += `${table}.${column} -> ${ref.references}\n`;
            }
          }
        }
      }
    }

    // Use your exact prompt structure
    const prompt = `
    You are a PostgreSQL expert. Convert the user request into a valid PostgreSQL query following these rules:

    🔹 **General PostgreSQL Rules**
    - Use **double quotes** for table and column names (e.g., "user", "project").
    - Use **COALESCE()** for NULL handling when necessary.
    - Use **LEFT JOIN** instead of INNER JOIN when optional data might be missing.

    🔹 **Handling Counts & Aggregations**
    - Use \`COUNT(DISTINCT column_name)\` to prevent duplicate counts in joins.
    - Always group by the primary key of the main entity.
    - Use \`HAVING COUNT(*) > X\` only when necessary.

    🔹 **Strict Table Relationships**
    - Use only **defined relationships** from the database schema.
    - **DO NOT assume relationships** between tables unless explicitly defined.
    - If a relationship does not exist, return an error instead of making assumptions.

    🔹 **Avoiding Data Type Errors**
    - Always ensure JOIN conditions match column types.
    - If necessary, use **CAST(column AS target_type)**.

    🔹 **Optimizations**
    - Use **WHERE** clauses instead of unnecessary HAVING filters.
    - Use **EXISTS** instead of JOINs when filtering large datasets.
    - Optimize performance with **LIMIT and OFFSET** when needed.

    ${DB_SCHEMA}
    ${relationship_info}

    User Request: "${userInput}"
    SQL Query:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const query = response.choices[0]?.message?.content?.trim();
    if (!query) {
      throw new Error('No query generated');
    }

    return NextResponse.json({ query });
  } catch (error) {
    console.error('Error generating query:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate query' },
      { status: 500 }
    );
  }
}