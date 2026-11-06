import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/lib/adminAuth';
import User from '@/models/User';

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    }
  );
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return jsonError('Admin access required', 403);
    }

    const { id } = await context.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return jsonError('Invalid user ID', 400);
    }

    if (id.toLowerCase() === admin.id.toLowerCase()) {
      return jsonError(
        'You cannot modify your own admin account',
        403
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonError('Invalid request body', 400);
    }

    const payload = body as Record<string, unknown>;
    const keys = Object.keys(payload);
    const allowedKeys = ['role', 'isVerified'];

    if (
      keys.length === 0 ||
      keys.some((key) => !allowedKeys.includes(key))
    ) {
      return jsonError('Invalid update fields', 400);
    }

    const updates: {
      role?: 'buyer' | 'artist';
      isVerified?: boolean;
    } = {};

    if ('role' in payload) {
      if (
        payload.role !== 'buyer' &&
        payload.role !== 'artist'
      ) {
        return jsonError(
          'Role must be buyer or artist',
          400
        );
      }

      updates.role = payload.role;
    }

    if ('isVerified' in payload) {
      if (typeof payload.isVerified !== 'boolean') {
        return jsonError(
          'Verification status must be a boolean',
          400
        );
      }

      updates.isVerified = payload.isVerified;
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: id,
        role: { $ne: 'admin' },
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        '_id name email role profileImage isVerified membershipTier location createdAt'
      )
      .lean();

    if (!updatedUser) {
      return jsonError(
        'User not found or cannot be modified',
        404
      );
    }

    return NextResponse.json(
      {
        message: 'User updated successfully',
        user: updatedUser,
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch (error) {
    console.error('[PATCH /api/admin/users/[id]]', error);

    return jsonError('Failed to update user', 500);
  }
}