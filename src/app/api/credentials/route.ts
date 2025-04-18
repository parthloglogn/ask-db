// app/api/credentials/route.ts

import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authConfig } from '../../../lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { serializeBigInt } from '@/utils/serialization';

export async function GET(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
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

    const credentials = await prisma.userCredentials.findMany({
      where: { user_id: user.id },
      orderBy: { modified_ts: 'desc' },
    });

    const serialized = credentials.map((cred) => ({
      ...cred,
      id: cred.id.toString(),
      user_id: cred.user_id.toString(),
      created_ts: cred.created_ts.toISOString(),
      modified_ts: cred.modified_ts.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
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

    const { credentials } = await request.json();

    if (!credentials) {
      return NextResponse.json({ error: 'Missing credentials data' }, { status: 400 });
    }

    const newCredential = await prisma.userCredentials.create({
      data: {
        user_id: user.id,
        credentials,
        created_by: session.user.email,
        modified_by: session.user.email,
      },
    });

    const serialized = {
      ...newCredential,
      id: newCredential.id.toString(),
      user_id: newCredential.user_id.toString(),
      created_ts: newCredential.created_ts.toISOString(),
      modified_ts: newCredential.modified_ts.toISOString(),
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, email } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing credential ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const credential = await prisma.userCredentials.findUnique({
      where: { id: BigInt(id) },
    });

    if (!credential || credential.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this credential' }, { status: 403 });
    }

    await prisma.userCredentials.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
