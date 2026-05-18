// backend/src/app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

async function exchangeCodeForTokens(code: string) {
  const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

async function getGoogleProfile(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google profile');
  }

  return response.json();
}

function generateTokens(user: any) {
  const jti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, jti },
    JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, jti },
    JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${FRONTEND_URL}/login?error=google_auth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getGoogleProfile(tokens.access_token);

    let user = await prisma.user.findUnique({
      where: { googleId: profile.id },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
        });
      } else {
        user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              googleId: profile.id,
              avatar: profile.picture || null,
              isVerified: true,
            },
          });

          const workspace = await tx.workspace.create({
            data: {
              name: `${profile.name}'s Workspace`,
              slug: `${profile.name.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomBytes(4).toString('hex')}`,
            },
          });

          await tx.workspaceMember.create({
            data: {
              userId: newUser.id,
              workspaceId: workspace.id,
              role: 'OWNER',
            },
          });

          return newUser;
        });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const redirectUrl = new URL(`${FRONTEND_URL}/auth/google/callback`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('userId', user.id);
    redirectUrl.searchParams.set('email', user.email);
    redirectUrl.searchParams.set('name', user.name);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
}
