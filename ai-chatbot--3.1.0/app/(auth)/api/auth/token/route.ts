import { compare } from 'bcrypt-ts';
import { getUser } from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import { createToken } from '@/lib/native-auth/tokens';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const users = await getUser(email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordsMatch = await compare(password, users[0].password!);
    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const token = await createToken({
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Token auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
