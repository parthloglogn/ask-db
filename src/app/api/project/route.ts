import { getServerSession } from "next-auth";
import { authConfig } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { serializeBigInt } from '@/utils/serialization';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const projects = await prisma.project.findMany({
      where: {
        user_id: user.id,
      },
    });

    const totalProjectsCount = await prisma.project.count({
      where: {
        user_id: user.id,
      },
    });

    const serializedProjects = serializeBigInt(projects);

    return NextResponse.json({
      count: totalProjectsCount,
      projects: serializedProjects,
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();

    const {
      project_name,
      db_credential,
      selected_tables,
      table_relationships,
      user_id,
      created_by,
      connectionTestSuccessful
    } = body;

    if (!project_name || !db_credential) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProject = await prisma.project.create({
      data: {
        project_name,
        db_credential,
        selected_tables,
        table_relationships,
        user_id: user.id,
        created_by: session.user.email,
        connectionStatus: connectionTestSuccessful ? 'connected' : 'disconnected',
        created_ts: new Date(),
        modified_by: session.user.email,
        modified_ts: new Date(),
      },
    });

    const serializedProject = serializeBigInt(newProject);

    return NextResponse.json(serializedProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error. Please try again later.' },
      { status: 500 }
    );
  }
}
