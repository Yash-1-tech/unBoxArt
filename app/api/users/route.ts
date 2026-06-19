import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// GET /api/users — list artists or buyers
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const role = searchParams.get('role') || 'artist';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const skip = (page - 1) * limit;
    const letter = searchParams.get('letter');
    const q = searchParams.get('q');

    const query: Record<string, unknown> = { role };
    if (letter) query.name = { $regex: `^${letter}`, $options: 'i' };
    if (q) query.name = { $regex: q, $options: 'i' };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/users]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
