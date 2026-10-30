
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/email';

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // Parse request safely.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON request body', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return jsonError('Invalid registration data', 400);
    }

    const data = body as Record<string, unknown>;
    const { name, email, password } = data;

    // Validate required fields.
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return jsonError(
        'Name, email, and password are required',
        400
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || normalizedName.length > 100) {
      return jsonError(
        'Name must contain between 1 and 100 characters',
        400
      );
    }

    if (
      !normalizedEmail ||
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return jsonError('Please provide a valid email address', 400);
    }

    if (password.length < 8) {
      return jsonError(
        'Password must be at least 8 characters',
        400
      );
    }

    // bcrypt only processes up to 72 UTF-8 bytes.
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return jsonError(
        'Password must not exceed 72 UTF-8 bytes',
        400
      );
    }

    await connectDB();

    // Check for an existing account.
    const existing = await User.findOne({
      email: normalizedEmail,
    }).select('_id');

    if (existing) {
      return jsonError(
        'An account with this email already exists',
        409
      );
    }

    // Hash the password before storing it.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Public registration always creates a buyer account.
    // Artist privileges must be granted through a trusted
    // server-side approval or account-management process.
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'buyer',
      membershipTier: 'free',
      isVerified: false,
    });

    // Send welcome email without blocking registration.
    sendWelcomeEmail(
      normalizedName,
      normalizedEmail
    ).catch((emailError) => {
      console.error(
        '[Registration welcome email]',
        emailError
      );
    });

    // Never return password or password hash.
    const safeUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      membershipTier: user.membershipTier,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/auth/register]', err);

    // Handle duplicate email registrations, including
    // simultaneous requests that pass the initial lookup.
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === 11000
    ) {
      return jsonError(
        'An account with this email already exists',
        409
      );
    }

    if (
      err instanceof Error &&
      err.name === 'ValidationError'
    ) {
      return jsonError(
        'Invalid registration data',
        400
      );
    }

    return jsonError('Registration failed', 500);
  }
}
