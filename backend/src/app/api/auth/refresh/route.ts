// backend/src/app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { AuthService } from '../../../../../modules/auth/auth.service';

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token required' },
        { status: 401 }
      );
    }

    const result = await authService.refreshTokens(refreshToken);

    const response = NextResponse.json(result, { status: 200 });

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    const response = NextResponse.json(
      { message: error.message || 'Token refresh failed' },
      { status: 401 }
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}
