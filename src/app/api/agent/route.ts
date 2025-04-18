import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authConfig } from '../../../lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { serializeBigInt } from '@/utils/serialization';

// Common error messages
const ERROR_MESSAGES = {
  unauthorized: 'Unauthorized',
  userNotFound: 'User not found',
  agentNotFound: 'Agent not found',
  invalidInput: 'Invalid input data',
  serverError: 'Internal server error'
};

// Common Prisma includes
const agentIncludes = {
  project: true,
  credential: true
};

// Validate BigInt ID parameter
const validateId = (id: string) => {
  if (!/^\d+$/.test(id)) throw new Error('Invalid ID format');
  return BigInt(id);
};

// Unified error response
const errorResponse = (message: string, status: number) => 
  NextResponse.json({ error: message }, { status });

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return errorResponse(ERROR_MESSAGES.unauthorized, 401);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) return errorResponse(ERROR_MESSAGES.userNotFound, 404);

    const agents = await prisma.agent.findMany({
      where: { user_id: user.id },
      include: agentIncludes,
      orderBy: { modified_ts: 'desc' }
    });

    return NextResponse.json(serializeBigInt(agents));
  } catch (error) {
    console.error('GET Error:', error);
    return errorResponse(ERROR_MESSAGES.serverError, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return errorResponse(ERROR_MESSAGES.unauthorized, 401);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) return errorResponse(ERROR_MESSAGES.userNotFound, 404);

    const { agent_name, project_id, credential_id } = await request.json();
    if (!agent_name || !project_id || !credential_id) {
      return errorResponse(ERROR_MESSAGES.invalidInput, 400);
    }

    const newAgent = await prisma.agent.create({
      data: {
        user_id: user.id,
        project_id: validateId(project_id),
        credential_id: validateId(credential_id),
        agent_name,
        created_by: session.user.email,
        modified_by: session.user.email,
      },
      include: agentIncludes
    });

    return NextResponse.json(serializeBigInt(newAgent), { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(ERROR_MESSAGES.serverError, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return errorResponse(ERROR_MESSAGES.unauthorized, 401);

    const { id, is_active } = await request.json();
    if (typeof id === 'undefined' || typeof is_active === 'undefined') {
      return errorResponse(ERROR_MESSAGES.invalidInput, 400);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: validateId(id) },
    });

    if (!agent) return errorResponse(ERROR_MESSAGES.agentNotFound, 404);

    const updatedAgent = await prisma.agent.update({
      where: { id: validateId(id) },
      data: { is_active, modified_by: session.user.email },
      include: agentIncludes
    });

    return NextResponse.json(serializeBigInt(updatedAgent));
  } catch (error) {
    console.error('PUT Error:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(ERROR_MESSAGES.serverError, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) return errorResponse(ERROR_MESSAGES.unauthorized, 401);

    const { id } = await request.json();
    if (!id) return errorResponse(ERROR_MESSAGES.invalidInput, 400);

    const agent = await prisma.agent.findUnique({
      where: { id: validateId(id) },
    });

    if (!agent) return errorResponse(ERROR_MESSAGES.agentNotFound, 404);

    await prisma.agent.delete({
      where: { id: validateId(id) },
    });

    return NextResponse.json({ success: true, message: 'Agent deleted' });
  } catch (error) {
    console.error('DELETE Error:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(ERROR_MESSAGES.serverError, 500);
  }
}