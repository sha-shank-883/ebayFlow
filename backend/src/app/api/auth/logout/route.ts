// backend/src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';

const authService = new AuthService();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
