// backend/src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { AuthService } from '../../../../../modules/auth/auth.service';
import { RegisterDto } from '../../../../../modules/auth/dto/register.dto';

const authService = new AuthService();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 5;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  record.count++;
  if (record.count > maxAttempts) {
    return false;
  }
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 1000);

function validateRegisterDto(body: any): { valid: boolean; errors?: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  
  if (!body.name || typeof body.name !== 'string' || body.name.length < 2) {
    errors.name = ['Name must be at least 2 characters'];
  }
  
  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = ['Valid email is required'];
  }
  
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = ['Password must be at least 8 characters'];
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(body.password)) {
    errors.password = ['Password must contain uppercase, lowercase, number, and special character'];
  }
  
  if (body.workspaceName !== undefined && (typeof body.workspaceName !== 'string' || body.workspaceName.length < 2)) {
    errors.workspaceName = ['Workspace name must be at least 2 characters'];
  }
  
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true };
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { message: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    console.log('[Register] Received payload:', JSON.stringify(body, null, 2));

    const validation = validateRegisterDto(body);

    if (!validation.valid) {
      console.error('[Register] Validation failed:', JSON.stringify(validation.errors, null, 2));
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.errors },
        { status: 400 }
      );
    }

    const dto: RegisterDto = {
      name: body.name,
      email: body.email.toLowerCase(),
      password: body.password,
      workspaceName: body.workspaceName,
    };

    console.log('[Register] Validation passed, creating user...');
    const result = await authService.register(dto);
    console.log('[Register] User created successfully');

    const response = NextResponse.json(result, { status: 201 });

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Register] Error:', error.message);
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
