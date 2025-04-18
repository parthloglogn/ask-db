// app/api/apikeys/route.ts

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

    const apiKeys = await prisma.apiKey.findMany({
      where: { user_id: user.id },
      orderBy: { modified_ts: 'desc' },
    });

    const serialized = apiKeys.map((key) => ({
      ...key,
      id: key.id.toString(),
      user_id: key.user_id.toString(),
      created_ts: key.created_ts.toISOString(),
      modified_ts: key.modified_ts.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching API keys:', error);
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

    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Missing provider or API key' }, { status: 400 });
    }

    // Check if API key already exists for this provider
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        user_id: user.id,
        provider
      }
    });

    if (existingKey) {
      return NextResponse.json({ error: 'API key already exists for this provider' }, { status: 400 });
    }

    const newApiKey = await prisma.apiKey.create({
      data: {
        user_id: user.id,
        provider,
        apiKey,
        created_by: session.user.email,
        modified_by: session.user.email,
      },
    });

    const serialized = {
      ...newApiKey,
      id: newApiKey.id.toString(),
      user_id: newApiKey.user_id.toString(),
      created_ts: newApiKey.created_ts.toISOString(),
      modified_ts: newApiKey.modified_ts.toISOString(),
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing API key ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: BigInt(id) },
    });

    if (!apiKey || apiKey.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this API key' }, { status: 403 });
    }

    await prisma.apiKey.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}