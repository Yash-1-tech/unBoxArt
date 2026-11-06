
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import {
  sessionOptions,
  type SessionData,
} from '@/lib/session';

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export async function getAdminUser(): Promise<AdminIdentity | null> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  const userId = session.user?.id;

  if (
    typeof userId !== 'string' ||
    !/^[a-fA-F0-9]{24}$/.test(userId)
  ) {
    return null;
  }

  await connectDB();

  const user = await User.findById(userId)
    .select('_id name email role profileImage')
    .lean();

  if (!user || user.role !== 'admin') {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
  };
}
