// app/api/project/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: BigInt(params.id) },
      select: {
        id: true,
        project_name: true,
        db_credential: true,
        selected_tables: true,
        table_relationships: true,
        connectionStatus: true,
        modified_ts: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert BigInt to string if needed
    const serializedProject = {
      ...project,
      id: project.id.toString(),
      modified_ts: project.modified_ts.toISOString()
    };

    return NextResponse.json(serializedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}