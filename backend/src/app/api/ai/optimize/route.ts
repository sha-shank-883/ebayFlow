// backend/src/app/api/ai/optimize/route.ts
import { NextResponse } from 'next/server';
import { optimizeListing } from '@/lib/openai';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { title, description } = await request.json();
    const result = await optimizeListing(title, description);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'AI Optimization failed' },
      { status: 500 }
    );
  }
}
