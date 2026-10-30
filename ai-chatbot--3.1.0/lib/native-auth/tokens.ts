import { SignJWT, jwtVerify, JWTPayload } from 'jose';

function getJWTSecret() {
  const secret = process.env.AUTH_SECRET;
  if (
    typeof secret !== 'string' ||
    !secret.trim() ||
    secret.trim() === 'your-secret-key' ||
    new TextEncoder().encode(secret).length < 32
  ) {
    throw new Error('AUTH_SECRET must be a unique random secret of at least 32 bytes');
  }
  return new TextEncoder().encode(secret);
}

export interface TokenPayload extends JWTPayload {
  id: string;
  email: string;
  name?: string;
}

export async function createToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJWTSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    const { id, email, name } = payload as any;
    if (!id || !email) return null;
    return { id, email, name } as TokenPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}
